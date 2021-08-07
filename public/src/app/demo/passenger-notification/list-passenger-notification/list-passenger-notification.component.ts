import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';
import { PassengerService, AuthService } from '../../services';
import { ToastData, ToastOptions, ToastyService } from 'ng2-toasty';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';
import * as moment from 'moment';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { NotifyService } from '../../services/notify.service';
import { Validation } from '../../helper/validation';

@Component({
  selector: 'app-list-passenger-notification',
  templateUrl: './list-passenger-notification.component.html'
})
export class ListPassengerNotificationComponent implements OnInit {

  public loading = false;
  public primaryColour = "#ffffff";
  public secondaryColour = "#ffffff";
  position = 'bottom-right';
  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;
  dtOptions: DataTables.Settings = {};
  dtTrigger: Subject<any> = new Subject();
  passengers;
  profilePhotoUrl: any;
  public masterSelected = false;
  public DeleteDisabled = false;
  checkedList: any;
  statusList = [];
  notificationForm: FormGroup;
  notificationForms: FormGroup;
  isSubmitted: boolean = false;
  isAllSubmitted: boolean = false;

  @ViewChild('closeBtn') closeBtn;
  @ViewChild('modalDefault1') modalDefault1;
  @ViewChild('modalDefault') modalDefault;
  constructor(
    private passengerService: PassengerService,
    private toastyService: ToastyService,
    private authService: AuthService,
    private notifyService: NotifyService,
    private validation: Validation,

  ) { }

  ngOnInit() {
    this.notificationForm = new FormGroup({
      message: new FormControl("", [Validators.required]),
      title: new FormControl("", [
        Validators.required,
        // Validators.pattern(this.validation.alpha_numeric_space),
        Validators.minLength(1),
        Validators.maxLength(45)
      ]),
    });
    this.notificationForms = new FormGroup({
      message: new FormControl("", [Validators.required]),
      title: new FormControl("", [
        Validators.required,
        // Validators.pattern(this.validation.alpha_numeric_space),
        Validators.minLength(1),
        Validators.maxLength(35)
      ]),
    });
    this.profilePhotoUrl = environment.profileImageUrl;
    this.authService.clearDataTableData("DataTables_passenger_management");
    this.loading = true;
    this.dtOptions = {
      pagingType: "full_numbers",
      pageLength: 10,
      order: [1, "desc"],
      serverSide: true,
      processing: false,
      stateSave: true,
      stateSaveCallback: function (settings, data) {
        localStorage.setItem(
          "DataTables_passenger_management",
          JSON.stringify(data)
        );
      },
      stateLoadCallback: function (settings) {
        return JSON.parse(localStorage.getItem("DataTables_passenger_management"));
      },
      ajax: (dataTablesParameters: any, callback) => {
        dataTablesParameters.search.value = dataTablesParameters.search.value.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '');
        this.passengerService.ListOfAllPassengers(dataTablesParameters).subscribe(
          resp => {
            this.loading = false;
            this.passengers = resp.data;
            for (let index = 0; index < this.passengers.length; index++) {
              if (moment().format('D') == moment(this.passengers[index].dob).format('D') && moment().format('MMMM') == moment(this.passengers[index].dob).format('MMMM')) {
                this.passengers[index].isSelected = true;
              } else {
                this.passengers[index].isSelected = false;
              }
            }
            for (let index = 0; index < this.passengers.length; index++) {
              this.passengers[index].isCheck = false;
            }
            callback({
              recordsTotal: resp.recordsTotal,
              recordsFiltered: resp.recordsFiltered,
              data: []
            });
          },
          error => {
            this.loading = false;
            this.addToast({ title: 'Error', msg: error.message, timeout: 5000, theme: 'default', position: 'bottom-right', type: 'error' });
          }
        );
      },
      columns: [
        { data: "checkid", orderable: false },
        { data: "autoIncrementID" },
        { data: "uniqueID", orderable: false },
        { data: "email" },
        { data: "name" },
        { data: "countryCode" },
        { data: "onlyPhoneNumber" },
        { data: "dob", searchable: false },
        { data: "createdAt", searchable: false },
        { data: "profilePhoto", orderable: false }
        // { data: "actions", orderable: false, searchable: false }
      ]
    };
  }
  openModal() {
    this.isSubmitted = false;
    this.notificationForms.reset();
    this.modalDefault1.show();
  }
  openModals() {
    this.isSubmitted = false;
    this.notificationForm.reset();
    this.modalDefault.show();
  }
  checkUncheckAll() {
    for (var i = 0; i < this.passengers.length; i++) {
      this.passengers[i].isCheck = this.masterSelected;
    }
    this.getCheckedItemList();
  }

  isAllSelected() {
    this.masterSelected = this.passengers.every(function (item: any) {
      return item.isCheck == true;
    })
    this.getCheckedItemList();
  }

  getCheckedItemList() {
    this.checkedList = [];
    for (var i = 0; i < this.passengers.length; i++) {
      if (this.passengers[i].isCheck)
        this.checkedList.push(this.passengers[i]._id);
    }
    this.checkedList = JSON.stringify(this.checkedList);
    if (this.checkedList.length > 0) {
      this.DeleteDisabled = false;
    } else {
      this.DeleteDisabled = true;
    }
    this.statusList = JSON.parse(this.checkedList);
  }
  onFormSubmit() {
    this.isSubmitted = true;
    if (this.notificationForm.valid) {
      this.loading = true;
      let senddata = { ...this.notificationForm.value, ids: this.checkedList }
      this.notifyService.SendNotificationToPassenger(senddata)
        .subscribe(next => {
          this.loading = false;
          this.isSubmitted = false;
          if (next.status_code == 200) {
            this.modalDefault.hide();
            this.addToast({ title: 'Success', msg: next.message, timeout: 5000, theme: 'default', position: 'bottom-right', type: 'success' });
            this.notificationForm.reset();
          } else {
            this.addToast({ title: 'Error', msg: next.message, timeout: 5000, theme: 'default', position: 'bottom-right', type: 'error' });
          }
        },
          error => {
            this.loading = false;
            this.isSubmitted = false;
            this.addToast({ title: 'Error', msg: error.message, timeout: 5000, theme: 'default', position: 'bottom-right', type: 'error' });
          })
    }
  }
  onNotificationFormSubmit() {
    this.isAllSubmitted = true;
    if (this.notificationForms.valid) {
      this.loading = true;
      let senddata = { ...this.notificationForms.value, flag: 'all' }
      this.notifyService.SendNotificationToPassenger(senddata)
        .subscribe(next => {
          this.loading = false;
          this.isAllSubmitted = false;
          if (next.status_code == 200) {
            this.modalDefault1.hide();
            this.addToast({ title: 'Success', msg: next.message, timeout: 5000, theme: 'default', position: 'bottom-right', type: 'success' });
            this.notificationForms.reset();
          } else {
            this.addToast({ title: 'Error', msg: next.message, timeout: 5000, theme: 'default', position: 'bottom-right', type: 'error' });
          }
        },
          error => {
            this.loading = false;
            this.isAllSubmitted = false;
            this.addToast({ title: 'Error', msg: error.message, timeout: 5000, theme: 'default', position: 'bottom-right', type: 'error' });
          })
    }
  }

  addToast(options) {
    if (options.closeOther) {
      this.toastyService.clearAll();
    }
    this.position = options.position ? options.position : this.position;
    const toastOptions: ToastOptions = {
      title: options.title,
      msg: options.msg,
      showClose: options.showClose,
      timeout: options.timeout,
      theme: options.theme,
      onAdd: (toast: ToastData) => {
      },
      onRemove: (toast: ToastData) => {
      }
    };

    switch (options.type) {
      case 'default': this.toastyService.default(toastOptions); break;
      case 'info': this.toastyService.info(toastOptions); break;
      case 'success': this.toastyService.success(toastOptions); break;
      case 'wait': this.toastyService.wait(toastOptions); break;
      case 'error': this.toastyService.error(toastOptions); break;
      case 'warning': this.toastyService.warning(toastOptions); break;
    }
  }

  blockUnblockPassenger(passenger: any) {
    let text;
    if (passenger.isBlocked) {
      text = 'You want to unblock this passenger ?';
    } else {
      text = 'You want to block this passenger ?';
    }

    Swal({
      title: 'Are you sure?',
      text: text,
      type: 'warning',
      showCloseButton: true,
      showCancelButton: true
    }).then((willDelete) => {
      if (willDelete && !willDelete.dismiss) {
        let data = {
          'passenger_id': passenger._id
        }
        this.passengerService.blockUnblockPassenger(data).subscribe(
          next => {
            if (next.status_code == 200) {
              this.rerender();
              if (passenger.isBlocked) {
                Swal('Success', "Passenger unblocked successfully.", 'success');
              } else {
                Swal('Success', "Passenger blocked successfully.", 'success');
              }
            } else {
              Swal('Error', next.message, 'error');
            }
          },
          error => {
            Swal('Error', error.message, 'error');
          }
        );
      } else {

      }
    });
  }
  imgErrorHandler(event) {
    event.target.src = this.profilePhotoUrl + 'default.png';
  }

  ngAfterViewInit(): void {
    this.dtTrigger.next();
  }

  rerender(): void {
    this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
      dtInstance.destroy();
      this.dtTrigger.next();
    });
  }
}
