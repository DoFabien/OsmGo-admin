import { Component, OnInit } from '@angular/core';
import { TagsService } from 'src/app/services/tags.service';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-add-new-configuration',
  templateUrl: './add-new-configuration.component.html',
  styleUrls: ['./add-new-configuration.component.css']
})
export class AddNewConfigurationComponent implements OnInit {

  newLanguage
  newCountry

  fromLanguage
  fromCountry

  selectedFromLanguage
  

  constructor( public dataService: DataService) { }

  ngOnInit() {
  }




 


}
