import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'searchPresets'
})
export class SearchPresetsPipe implements PipeTransform {

  transform(presets: any, searchText:string, language:string): any {
    if (!presets) {
      return [];
    }
    if (!searchText || searchText === '') {
      return presets;
    }

    return presets.filter(it => {
      const re = new RegExp(searchText, 'i');

      return re.test( it.key || it._id || re.test(it.lbl[language]) ) ;
    });

  }

}
