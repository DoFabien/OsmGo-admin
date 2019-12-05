import { Component, OnInit } from '@angular/core';
import { TagsService } from 'src/app/services/tags.service';
import { ActivatedRoute, Router } from '@angular/router';
import { tap, map, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { forkJoin, Subscription, Subject } from 'rxjs';

@Component({
  selector: 'app-presets',
  templateUrl: './presets.component.html',
  styleUrls: ['./presets.component.scss']
})
export class PresetsComponent implements OnInit {

  presets = [];
  flatTags
  newPresetOption = { v: null, lbl: null }
  selectedIdInit;
  displayTagsUsed = false;

  keyUp = new Subject<KeyboardEvent>();
  private skeyUpSubscription: Subscription;
  searchTerm:string =  '';

  selectedPreset;

  constructor(private route: ActivatedRoute,
    private router: Router,
    public tagsService: TagsService) { }

  ngOnInit() {
    this.tagsService.language = this.route.snapshot.paramMap.get("language")

    this.route.queryParams
      .subscribe(params => {
        if (params.presetId) {
          this.selectedIdInit = params.presetId;
        }
      });

      this.tagsService.wsUpdateTagConfig$()
      .subscribe(tagConfigChange => {
        this.tagsService.updateTagConfig(tagConfigChange)
      })

    this.tagsService.wsDeleteTagConfig$()
      .subscribe(d => {
        this.tagsService.tagsConfig = this.tagsService.tagsConfig.filter(t => t.id !== d.tagId)
      })

      this.tagsService.wsDeletePresetConfig$()
      .subscribe(presetConfigChange => {
       this.selectedPreset = undefined;
       this.presets = this.presets.filter( p => p._id !== presetConfigChange.presetId)
      })
      


    forkJoin(
      this.tagsService.getTags$(),
      this.tagsService.getPresets$()
        .pipe(

          map(presetsObject => {
            let flatPresets = [];
            for (let k in presetsObject) {
              let preset = presetsObject[k]
              preset['_id'] = k;
              flatPresets.push(preset);
            }
            return flatPresets
          })
        )
    )
      .subscribe(([tags, presets]) => {
        const presetsList = [];
        for (let key in presets) {
          let usedByTags = tags.filter(o => o.presets.includes(presets[key]._id))
          presetsList.push({ ...presets[key], usedByTagsCount: usedByTags.length })
        }

        this.presets = presetsList;

        if (this.selectedIdInit ){
          this.selectPreset( this.presets.find( p => p._id === this.selectedIdInit ))
        }
      })


      this.tagsService.wsUpdatePresetConfig$()
      .subscribe(presetConfigChange => {
        console.log(presetConfigChange);
        this.updatePresetConfig(presetConfigChange)
      })



      this.skeyUpSubscription = this.keyUp.pipe(
        map(event => event.target['value']),
        debounceTime(300),
        distinctUntilChanged()
      ).subscribe(text => {
        this.searchTerm = text;
      });
  }


  updatePresetConfig(changes){
         console.log(changes);
      let currentPresetConfig= this.presets.find(o => o._id === changes.presetId);
  
      // let currentTagConfig = tags[pkey].values.find( o => o.id === data.tagConfigId)
      console.log(currentPresetConfig);
  
      if (changes.key === 'lbl') {
        currentPresetConfig[changes.key][changes.language] = changes.newValue
      }
      else {
        currentPresetConfig[changes.key] = changes.newValue
      }
      // else if (changes.key === 'deprecated' || changes.key === 'presets') {
      //   currentPresetConfig[changes.key] = changes.newValue
      // }
  }


  selectPreset(preset) {
    let usedByTags = this.tagsService.tagsConfig.filter(o => o.presets.includes(preset._id))
    this.selectedPreset = { ...preset, usedByTags: usedByTags};
    console.log(this.selectedPreset);
    this.router.navigate([], {
      queryParams: {
        presetId: preset._id
      },
      queryParamsHandling: 'merge',
    });
  }

  deletePresetFromTag(tag, presetId){
    const newvalue = tag.presets.filter(r => r !== presetId)

    this.tagsService.updateTagConfig$(newvalue, 'presets', tag.id, null)
      .subscribe(
        this.selectedPreset.usedByTags = this.selectedPreset.usedByTags.filter(t => t.id !== tag.id)
 
      )
  }

  // delete preset ( preset & presets in use by tag)
  deletePresetCascade(presetId){

    this.tagsService.deletePreset$(presetId).subscribe();
    // const tagsUseThisPreset = this.tagsService.tagsConfig.filter( t => t.presets.includes(presetId))
    // console.log(tagsUseThisPreset);

    // for (let tag of tagsUseThisPreset){ // TODO : server side! rof, ça ira bien pour l'instant
    //   const newvalue = tag.presets.filter(r => r !== presetId)
    // this.tagsService.updateTagConfig$(newvalue, 'presets', tag.id, null)
    // .subscribe()

    // }

  }


  updatePreset(newValue, key, presetId, language) {
    this.tagsService.updatePresetConfig$(newValue, key, presetId, language)
    .subscribe( re => console.log(re))
  }

  labelChange(e, preset,language ) {
    // console.log(e.target.value, preset,language )
    this.tagsService.updatePresetConfig$(e.target.value, 'lbl', preset._id, language)
    .subscribe( re => console.log(re))
 
  }

  addOption(newOption) {
    this.selectedPreset.tags = [...this.selectedPreset.tags, newOption]
    this.newPresetOption = { v: null, lbl: null }
    // this.updatePreset(this.selectedPreset)
  }

  deleteOption(option) {
    this.selectedPreset.tags = [...this.selectedPreset.tags.filter(t => t.v !== option.v)]
    // this.updatePreset(this.selectedPreset)
  }

  optionChangeOrder(index, newIndex) {
    this.array_move(this.selectedPreset.tags, index, newIndex)
    // this.updatePreset(this.selectedPreset)
  }

  array_move(arr, old_index, new_index) {
    if (new_index >= arr.length) {
      var k = new_index - arr.length + 1;
      while (k--) {
        arr.push(undefined);
      }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
  };

  toOsmPage(key) {
  
    window.open(`https://wiki.openstreetmap.org/wiki/Key:${key}`, '_blank');
  }


}
