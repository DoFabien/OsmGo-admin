import { Component, OnInit, Inject } from '@angular/core';
import { TagsService } from '../../services/tags.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

@Component({
  selector: 'app-dialog-icon',
  templateUrl: './dialog-icon.component.html',
  styleUrls: ['./dialog-icon.component.css']
})
export class DialogIconComponent implements OnInit {
  iconList;
  searchName: String = '';

  constructor(private tagsService: TagsService,
    public dialogRef: MatDialogRef<DialogIconComponent>,
    @Inject(MAT_DIALOG_DATA) public data) {
  }


  selectNewIcon(iconName: string) {
    // console.log(this.data)
    this.tagsService.updateTagConfig$(iconName, 'icon', this.data.tagConfig.id, null).subscribe()
    // this.tagService.tagConfigChange(this.selectedTagValueConfig.presets, 'presets', this.selectedTagValueConfig.id, null);

    // const currentTag = this.tagService.tagsConfig[this.data.primaryKey].values
    //   .filter(it => it.key === this.data.primaryValue)[0];
    // currentTag['icon'] = iconName;

    // this.tagsService.updatePrimaryTag(this.data.primaryKey, this.data.primaryValue, currentTag)
    //   .subscribe();
    this.dialogRef.close();
  }

  ngOnInit() {
    this.tagsService.iconsList$().subscribe(icons => {
      this.iconList = icons;
    });
  }

}
