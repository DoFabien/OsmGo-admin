import { Component, OnInit, Inject } from '@angular/core';
import { TagsService } from '../../services/tags.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-dialog-modify-presets',
  templateUrl: 'dialog-modify-presets.html',
  styleUrls: ['./dialog-modify-presets.scss']
})


export class DialogModifyPresetsAppComponent {
  step = 1;
  searchTextAddPreset = '';
  presetsConfig = [];
  presets;
  genericPresets = [];
  selectedPreset;
  typeModif;
  tagsUseThisPreset;
  tagId

  enableForm = false;
  presetKeyIsFixed = false;
  statsTags;
  newValue = { 'v': '', 'lbl': '' };

  // tagsUseThisPreset: Observable<any>;

  constructor(
    public tagsService: TagsService,
    public dialogRef: MatDialogRef<DialogModifyPresetsAppComponent>,
    @Inject(MAT_DIALOG_DATA) public data) {

      this.presets = {...this.data.presets};
      console.log(this.data);
      // console.log(this.presets);
      this.typeModif = this.data.type;
      this.tagId = this.data.tagId;

      this.presetsConfig = 
      Object.keys(this.tagsService.presetsConfig).map( k => {
        return {_id:k,  ...this.tagsService.presetsConfig[k], 
          used_by: this.tagsService.tagsConfig.filter( t => t.presets.includes(k)).length}
      });

  }

  ngOnInit(): void {

    console.log(this.typeModif);
    console.log(this.presets)
    if (this.typeModif === 'update'){
      this.step = 4
    }

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

  onNoClick(): void {
    this.dialogRef.close(this.presets);
  }


  addNewValue(newValue) {
    this.presets.tags.push(newValue);
    this.newValue = { 'v': '', 'lbl': '' };
  }

  addThisPresetOption(value){
    this.presets.tags.push({ 'v': value, 'lbl': value});
  }

  selectPresets(selectedPreset) {
    this.selectedPreset = selectedPreset;
    this.presets = selectedPreset;
    if (this.typeModif == 'add'){
      this.step = 3
    }
  }
  submit(selectedPreset){
    const presetId= selectedPreset._id;

    const currentTag = this.tagsService.tagsConfig.find( t => t.id === this.tagId);
    let newPresetList = [...currentTag.presets]
    if (!currentTag.presets.includes(presetId)){
      newPresetList = [...currentTag.presets, presetId]
    }

    this.tagsService.updateTagConfig$(newPresetList, 'presets', this.tagId, null)
    .subscribe( d => {
      this.dialogRef.close()
    })
  }

  newPreset(newPresetValue: string) {
    this.presets = { type: 'text', tags: [], 'key': newPresetValue, 'lbl': newPresetValue, _id: newPresetValue };
    this.step++;
  }

 

}
