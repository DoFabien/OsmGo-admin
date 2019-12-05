import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable} from 'rxjs';
import { map, shareReplay} from 'rxjs/operators';
import { HttpHeaders } from '@angular/common/http';
import { DataService } from './data.service';

import * as io from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class TagsService {

  presetsConfig = {};
  tagsConfig = [];
  aggStats;
  language;
  country;


  socket;
  constructor(private http: HttpClient, public dataService: DataService) {
    this.socket = io({
      secure: false,
      rejectUnauthorized: false,
      path: '/api/ws/'
    });
    // console.log(this.socket);
  }

  getTags$() {
    return this.http.get<any[]>(`./api/OsmGoTags/`, this.dataService.getHttpOption())
      .pipe(
        map(tags => {
          this.tagsConfig = tags;
          return tags;
        }))

  }

  getPresets$() {
    return this.http.get(`./api/OsmGoPresets/`)
      .pipe(
        map(data => {

          const withId = {}
          for (let k in data) {
            withId[k] = { ...data[k], _id: k }

          }

          this.presetsConfig = withId
          return withId;
        })
      );
  }

  // When a tag has change (from me or another user)
  wsUpdateTagConfig$ = () => {
    let ob: Observable<any> = new Observable(((observer: any) => {
      this.socket.on('updateTagConfig', (message) => {
        observer.next(message);
      });
    }))
    return ob
  }

 // When a tag has deleted (from me or another user)
  wsDeleteTagConfig$ = () => {
    let ob: Observable<any> = new Observable(((observer: any) => {
      this.socket.on('deleteTagConfig', (message) => {
        observer.next(message);
      });
    }))
    return ob
  }

  wsUpdatePresetConfig$ = () => {
    let ob: Observable<any> = new Observable(((observer: any) => {
      this.socket.on('updatePresetConfig', (message) => {
        observer.next(message);
      });
    }))
    return ob
  }

  wsDeletePresetConfig$ = () => {
    let ob: Observable<any> = new Observable(((observer: any) => {
      this.socket.on('deletePresetConfig', (message) => {
        observer.next(message);
      });
    }))
    return ob
  }


    // When a UiTranslation
    wsUpdateUiTranslation$ = () => {
      let ob: Observable<any> = new Observable(((observer: any) => {
        this.socket.on('updateUiTranslation', (message) => {
          observer.next(message);
        });
      }))
      return ob
    }
  

  iconsList$(): Observable<any> {
    return this.http.get<any[]>('./api/svgList', this.dataService.getHttpOption()).pipe(
      shareReplay()
    );
  }


  getPresetsSummary(country, pkey, value) {
    return this.http.get(`./api/TagInfoLike/${country}/${pkey}/${value}`, this.dataService.getHttpOption());
  }


  tagsUseThisPreset$(idPreset: string) {
    return this.http.get(`./api/OsmGoTags/${this.language}/${this.country}`, this.dataService.getHttpOption()).pipe(
      map(el => {
        const keys = Object.keys(el);
        let tags = [];
        keys.map(key => {
          tags = [...tags, ...el[key].values];
        });
        return tags.filter(tag => tag['presets'].indexOf(idPreset) !== -1);
      }
      ),
      shareReplay()
    );
  }


  updateTagConfig$(newValue, key, tagConfigId, language) {
    const data = { newValue, key, tagConfigId, language }
    const url  = './api/tag/'

    return this.http.post<any>(url, data)
    .pipe(
      // catchError( err => console.log(err))
    );
  }

    // update local data
    updateTagConfig(changes) {
      let currentTagConfig = this.tagsConfig.find(o => o.id === changes.tagConfigId);
      if (changes.key === 'lbl' || changes.key === 'description' || changes.key === 'terms' || changes.key === 'alert' || changes.key === 'warning') {
        if (!currentTagConfig[changes.key]) {
          currentTagConfig[changes.key] = { 'en': '' }
        }
  
        currentTagConfig[changes.key][changes.language] = changes.newValue
      }
      else {
        currentTagConfig[changes.key] = changes.newValue
      }
    }


  updatePresetConfig$(newValue, key, presetId, language) {
    const data = { newValue, key, presetId, language }
    const url  = './api/preset/'
    return this.http.post<any>(url, data)
    .pipe(
      // catchError( err => console.log(err))
    );
  }


  deleteTag(tagId) {
    const data = { tagId }
    const url  = `./api/tag/`

    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      }),
      body: data
    }
    return this.http.delete<any>(url, options)
  }

  deletePreset$(presetId) {
    const data = { presetId }
    const url  = `./api/preset/`

    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      }),
      body: data
    }
    return this.http.delete<any>(url, options)
  }
}
