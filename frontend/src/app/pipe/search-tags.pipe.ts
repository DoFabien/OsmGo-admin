import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'searchTags'
})
export class SearchTagsPipe implements PipeTransform {

  transform(tags: any, searchText:string, language:string): any {
    if (!tags) {
      return [];
    }
    if (!searchText || searchText === '') {
      return tags;
    }

    return tags.filter(it => {
      const re = new RegExp(searchText, 'i');

      return re.test( JSON.stringify(it.tags)) || re.test(it.lbl[language]) || re.test(it.terms && it.terms[language] ? it.terms[language] : null) ;
    });


  }

}
