import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { PageChangedEvent } from 'ngx-bootstrap/pagination';
import { Modules, Permission } from 'src/app/store/Role/role.models';
import { deleteNotificationlist, fetchNotificationlistData, updateNotificationlist } from 'src/app/store/notification/notification.action';
import { selectDataNotification } from 'src/app/store/notification/notification-selector';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css'
})
export class NotificationsComponent implements OnInit{
  
  // bread crumb items
  breadCrumbItems: Array<{}>;
  public Modules = Modules;
  public Permission = Permission;

  notificationList$: Observable<any[]>;
  isDropdownOpen : boolean = false;
  filteredArray: any[] = [];
  originalArray: any[] = [];

  itemPerPage: number = 10;
  currentPage : number = 1;

  columns : any[]= [
    { property: 'title', label: 'Title' },
    { property: 'description', label: 'Description' },
    { property: 'status', label: 'Status' },
  ];

  constructor(private store: Store) {
      
      this.notificationList$ = this.store.pipe(select(selectDataNotification)); // Observing the Notification list from Notification
  }

  ngOnInit() {
          
        this.store.dispatch(fetchNotificationlistData({ page: this.currentPage, itemsPerPage: this.itemPerPage }));
        this.notificationList$.subscribe(data => {
        this.originalArray = data; // Notification the full Notification list
        this.filteredArray = [...this.originalArray];
        document.getElementById('elmLoader')?.classList.add('d-none');
        console.log('Finish get Notification list');
        console.log(this.filteredArray);
        });
   }

 
  // pagechanged
  onPageChanged(event: PageChangedEvent): void {
    this.currentPage = event.page;
    this.store.dispatch(fetchNotificationlistData({ page: this.currentPage, itemsPerPage: this.itemPerPage }));
    
  }

  // Delete Notification
  onDelete(id: any) {
    this.store.dispatch(deleteNotificationlist({ notificationId: id }));
  }

 
  onChangeEvent( event: any) {
    const newStatus = event.checked ? 'undelivered' : 'delivered'; 
    console.log('Notification ID:', event.data.id, 'New Status:', newStatus);
    event.data.status = newStatus;
    this.store.dispatch(updateNotificationlist({ updatedData: event.data }));
  }


}
