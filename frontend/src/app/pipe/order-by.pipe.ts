import { Pipe, PipeTransform } from '@angular/core';
import * as _ from 'lodash';

@Pipe({
  name: 'orderBy'
})
export class OrderByPipe implements PipeTransform {

  transform(tags: any, args?: any): any {

   return _.orderBy(tags, [args[0]], [args[1] || 'asc']);
  }

}
