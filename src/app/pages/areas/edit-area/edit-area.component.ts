import { Component } from '@angular/core';

@Component({
  selector: 'app-edit-area',
  templateUrl: './edit-area.component.html',
  styleUrl: './edit-area.component.css'
})
export class EditAreaComponent {
  breadCrumbItems: Array<{}>;

  ngOnInit() {
    console.log('i am in edit area');
    this.breadCrumbItems = [{ label: 'Areas' }, { label: 'Edit Area', active: true }];
  }
}
