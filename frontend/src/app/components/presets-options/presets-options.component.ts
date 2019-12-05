import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { uniqBy, orderBy} from 'lodash'

@Component({
  selector: 'app-presets-options',
  templateUrl: './presets-options.component.html',
  styleUrls: ['./presets-options.component.css']
})
export class PresetsOptionsComponent implements OnInit {

  @Input() selectedPreset;
  @Input() language;
  @Output() presetChange = new EventEmitter<any>(); 
  newPresetOption = {v:null, lbl: null}

  constructor() { }

  ngOnInit() {
    
  }

  _orderBy(property){
    this.selectedPreset.options = orderBy(this.selectedPreset.options, [property])
  }

  addOption(_newOption){
    console.log('newOption', _newOption)

    let newOption= { v: _newOption.v, lbl:{}}
    newOption.lbl[this.language] = _newOption.lbl;
    if (!newOption.lbl['en'] ){
      newOption.lbl['en'] = _newOption.v
    }

    this.selectedPreset.options = uniqBy([...this.selectedPreset.options, newOption],'v')
    this.newPresetOption = {v:null, lbl: null}
    this.presetChange.emit(this.selectedPreset)
  }


  deleteOption(option){
    this.selectedPreset.options = [...this.selectedPreset.options.filter( t => t.v !== option.v)]
    this.presetChange.emit(this.selectedPreset)
  }

  optionChangeOrder(index, newIndex){
    this.array_move(this.selectedPreset.options, index,newIndex)
    this.presetChange.emit(this.selectedPreset)
  }

  labelChange(newValue, option, language){
    option.lbl[language] = newValue;
    this.presetChange.emit(this.selectedPreset)
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
