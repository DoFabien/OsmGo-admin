import { Component, OnInit } from '@angular/core';
import { DataService } from '../../services/data.service';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { TagsService } from 'src/app/services/tags.service';


const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json'
  })
};

@Component({
  selector: 'app-translate-ui',
  templateUrl: './translate-ui.component.html',
  styleUrls: ['./translate-ui.component.scss']
})
export class TranslateUiComponent implements OnInit {

  translationData = []

  constructor(
    public dataService: DataService,
    private router: Router,
    private route: ActivatedRoute,
    private http : HttpClient,
    private tagService: TagsService
  ) { }

  ngOnInit() {
    this.dataService.langageUiSelected = this.route.snapshot.paramMap.get("language")

    if (!this.dataService.langageUiSelected) {
      //this.dataService.langageUiSelected = 'fr'
      this.router.navigate(['/']);
      return;
    }

    this.tagService.wsUpdateUiTranslation$()
      .subscribe(change => {
        if (change.language === this.dataService.langageUiSelected){
          const currentElement = this.translationData.find( e => e.category == change.category && e.key == change.key );
          if (currentElement){
            currentElement['translation'] = change.newValue
          }
        }

      })
    
    forkJoin(
      this.getLanguageData$('en'),
      this.getLanguageData$(this.dataService.langageUiSelected)
    ).subscribe( data => {
      const en = data[0]
      const otherLang = data[1]
      for( let category in en){
        for (let key in en[category]){
            this.translationData = [
              ...this.translationData, 
              {category , key , 'en': en[category][key], 'translation': otherLang[category]  &&  otherLang[category][key] ? otherLang[category][key] : null }
            ]
        }
      }
    })


  }


  getLanguageData$(lang) {
    return this.http.get<any[]>(`api/UiTranslation/${lang}`)
    .pipe()
    ;
  }


  toI18Format(data){
    const i18Format ={};
    for (let item of data){
      if (item.translation && item.translation !=''){
        if (!i18Format[item.category]){
          i18Format[item.category] = {}
        }
        i18Format[item.category][item.key] = item.translation
      }
    }
    return i18Format
  }




  translationChange(newValue, category, key, language){
    console.log(newValue, category, key, language);
    const params = {newValue, category, key, language};
    this.http.post<any>(`api/UiTranslation/`, params, this.dataService.getHttpOption()).subscribe( e => {
      console.log(e);
    })
  }





}
