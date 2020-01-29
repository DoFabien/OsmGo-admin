import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { TagsService } from '../../services/tags.service';
import { TaginfoService } from '../../services/taginfo.service';
import { MatDialog } from '@angular/material';
import { DialogModifyPresetsAppComponent } from '../dialog-modify-presets/dialog-modify-presets';
import { DialogIconComponent } from '../dialog-icon/dialog-icon.component';
import { DialogAddPrimaryValueComponent } from '../dialog-add-primary-value/dialog-add-primary-value.component';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { SettingPkeyComponent } from '../setting-pkey/setting-pkey.component';
import { forkJoin, Subject, fromEvent, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';

@Component({
  selector: 'app-tags',
  templateUrl: './tags.component.html',
  styleUrls: ['./tags.component.css']
})
export class TagsComponent implements OnInit {
  keyUp = new Subject<KeyboardEvent>();
  private skeyUpSubscription: Subscription;
  selectedTagKey = undefined;
  currentSprite;
  selectedTagValueConfig = undefined;
  selectedPresetConfig;
  selectedPresetId;
  orderKey = 'key';
  orderType = 'asc';
  searchTerm:string =  '';
  isDeleteConfirm = false;

  newDefaultValue = { key: null, value: null }

  constructor(
    public tagsService: TagsService,
    public taginfoService: TaginfoService,
    public dialog: MatDialog,
    private route: ActivatedRoute,
    private router: Router,
  ) { }

  ngOnInit() {

    this.tagsService.language = this.route.snapshot.paramMap.get("language")

    if (!this.tagsService.language) {
      this.router.navigate(['/']);
      return
    }

    forkJoin(
      this.tagsService.getTags$(),
      this.tagsService.getPresets$()
    ).subscribe(([tagsConfig, presetsConfig]) => {
      // TODO: Loading
      // console.log(tagsConfig, presetsConfig);
    })


    this.tagsService.wsUpdateTagConfig$()
      .subscribe(tagConfigChange => {
        this.tagsService.updateTagConfig(tagConfigChange)
      })

    this.tagsService.wsDeleteTagConfig$()
      .subscribe(d => {
        this.tagsService.tagsConfig = this.tagsService.tagsConfig.filter(t => t.id !== d.tagId)
      })

    // presets has change
    this.tagsService.wsUpdatePresetConfig$()
      .subscribe(presetConfigChange => {
        // console.log(presetConfigChange);
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




  updatePresetConfig(changes) {
    // console.log(changes);
    let currentPresetConfig = this.tagsService.presetsConfig[changes.presetId];

    // let currentTagConfig = tags[pkey].values.find( o => o.id === data.tagConfigId)
    // console.log(currentPresetConfig);

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

  deleteTag(tagId) {

    this.tagsService.deleteTag(tagId).subscribe(deleted => {
      // console.log(deleted);
      // this.tagsService.tagsConfig[key].values = this.tagsService.tagsConfig[key].values.filter(f => f.key !== value);
    });

    this.isDeleteConfirm = false;
  }

  changeGeometry(checked, idgeom, tagId, geometry){
    // console.log(checked, idgeom, tagId, geometry)
    if (checked){
      if (!geometry.includes(idgeom)){
        geometry.push(idgeom)
      }
    }else {
      geometry = geometry.filter( g => g !== idgeom)
    }

    this.tagConfigChange(geometry, 'geometry', tagId, null)

  }

  deletePresetFromTag(tagid, deletedPresetId, presetList) {
    let newPresets = presetList.filter(f => f !== deletedPresetId)

    this.tagConfigChange(newPresets, 'presets', tagid, null);
  }

  selectKeyTagChange(e) {
    this.selectedTagValueConfig = undefined;
    this.selectedPresetConfig = undefined;
    this.selectedPresetId = undefined;
  }

  tagValueConfigChange(t) {
    this.selectedTagValueConfig = t;
  }

  presetSelect(preset) {
    this.selectedPresetId = preset;
  }


  openPresetsDialog(typeModif: string, tagId: string, presets = null): void {

    const dialogRef = this.dialog.open(DialogModifyPresetsAppComponent, {
      height: '80%',
      width: '80%',
      data: { type: typeModif, presets: presets, tagId: tagId }
    });

    dialogRef.afterClosed()
      .subscribe();
  }



  openDialogIconsSelector(tagConfig) {
    const dialogRef = this.dialog.open(DialogIconComponent, {
      height: '80%',
      width: '80%',
      data: { tagConfig: tagConfig }

    });

    dialogRef.afterClosed().subscribe(result => {

    });
  }

  openDialogAddPrimaryValue(primaryKey: string) {
    const dialogRef = this.dialog.open(DialogAddPrimaryValueComponent, {
      height: '80%',
      width: '80%',
      data: { primaryKey: primaryKey }

    });

    dialogRef.afterClosed().subscribe(result => {

    });
  }

  openDialogSettingsPkey(primaryKey) {
    const dialogRef = this.dialog.open(SettingPkeyComponent, {
      height: '80%',
      width: '80%',
      data: { primaryKey: primaryKey }

    });

    dialogRef.afterClosed().subscribe(result => {

    });

  }



  tagConfigChange(newValue, key, tagConfigId, language) {
    this.tagsService.updateTagConfig$(newValue, key, tagConfigId, language).subscribe()
    // console.log('tagConfigChange', newValue, key, tagConfigId, language)
   
  }

  getCountPrimaryKey(key, value) {
    if (!this.tagsService.aggStats || !this.tagsService.aggStats[key]) {
      return 0;
    }
    const statFinded = this.tagsService.aggStats[key].values.filter(el => el.value === value);
    if (!statFinded || !statFinded[0]) {
      return 0;
    } else {
      return ((statFinded[0]['count'] / this.tagsService.aggStats[key].sum) * 100).toFixed(3);
    }
  }

  toOsmPage(tags) {

    let keys = Object.keys(tags);


    window.open(`https://wiki.openstreetmap.org/wiki/Tag:${keys[0]}=${tags[keys[0]]}`, '_blank');
  }


  changeOrder(key) {
    this.orderKey = key;
    if (this.orderKey === key) {
      this.orderType = (this.orderType === 'asc') ? 'desc' : 'asc'
    }
  }


  optionChangeOrder(index, newIndex) {
    this.array_move(this.selectedTagValueConfig.presets, index, newIndex);
    // console.log(this.selectedTagValueConfig.presets);

    this.tagConfigChange(this.selectedTagValueConfig.presets, 'presets', this.selectedTagValueConfig.id, null);

    // this.primaryTagHasChanged(null)
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
}
