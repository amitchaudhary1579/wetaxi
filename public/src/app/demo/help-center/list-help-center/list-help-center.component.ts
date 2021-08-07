import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';
import { HelpCenterService, AuthService } from '../../services';
import { ToastData, ToastOptions, ToastyService } from 'ng2-toasty';
import Swal from 'sweetalert2';
import { FormControl, Validators, FormGroup } from '@angular/forms';
import { SettingService } from '../../services/setting.service';

class HelpCenter {
  email: string;
  name: string;
  phone_number: string;
}

class DataTablesResponse {
  data: any[];
  draw: number;
  recordsFiltered: number;
  recordsTotal: number;
}

@Component({
  selector: 'list-help-center',
  templateUrl: './list-help-center.component.html'
})
export class ListHelpcenterComponent implements AfterViewInit, OnInit {

  public loading = false;
  public operatorDisable = false;
  fbUrlForm: FormGroup;
  isSubmitted: boolean = false;
  public primaryColour = "#ffffff";
  public secondaryColour = "#ffffff";
  position = 'bottom-right';
  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;
  dtOptions: DataTables.Settings = {};
  dtTrigger: Subject<any> = new Subject();
  helpCenters: HelpCenter[];

  constructor(
    private helpCenterService: HelpCenterService,
    private authService: AuthService,
    private toastyService: ToastyService,
    private settingService: SettingService,

  ) { }

  ngOnInit() {
    this.getAdminFee();
    this.fbUrlForm = new FormGroup({
      fbUrl: new FormControl("", [Validators.required]),
    });
    let admindata = JSON.parse(localStorage.getItem('adminData'));
    if (admindata.type == "operator") {
      this.operatorDisable = true;
    } else {
      this.operatorDisable = false;
    }
    this.authService.clearDataTableData("DataTables_help_center_management");
    this.loading = true;
    this.dtOptions = {
      pagingType: "full_numbers",
      pageLength: 10,
      serverSide: true,
      processing: false,
      stateSave: true,
      stateSaveCallback: function (settings, data) {
        localStorage.setItem(
          "DataTables_help_center_management",
          JSON.stringify(data)
        );
      },
      stateLoadCallback: function (settings) {
        return JSON.parse(localStorage.getItem("DataTables_help_center_management"));
      },
      ajax: (dataTablesParameters: any, callback) => {
        dataTablesParameters.search.value = dataTablesParameters.search.value.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '');
        this.helpCenterService.ListOfAllHelpCenters(dataTablesParameters).subscribe(
          resp => {
            this.loading = false;
            this.helpCenters = resp.data;
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
        { data: "email" },
        { data: "phoneNumber" },
        { data: "actions", orderable: false, searchable: false }
      ]
    };
  }

  getAdminFee() {
    this.loading = true;
    let demo = "admin Fee";
    this.settingService.GetAdminFee(demo).subscribe(
      respone => {
        this.loading = false;
        this.fbUrlForm.setValue({
          fbUrl: respone.data.fbUrl
        });
      },
      error => {
        this.loading = false;
        // this.addToast({ title: 'Error', msg: error.message, timeout: 5000, theme: 'default', position: 'bottom-right', type: 'error' });
      }
    );
  }
 
  onfbFormSubmit() {
    this.isSubmitted = true;
    if (this.fbUrlForm.valid) {
      this.loading = true;
      this.settingService.UpdateFbUrl(this.fbUrlForm.value)
        .subscribe(next => {
          this.loading = false;
          this.isSubmitted = false;
          if (next.status_code == 200) {
            this.addToast({ title: 'Success', msg: next.message, timeout: 5000, theme: 'default', position: 'bottom-right', type: 'success' });
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

  operatorPermission() {
    Swal({
      title: 'Alert',
      text: 'You do not have a permission edit info',
      type: 'info',
      showCloseButton: true,
      showCancelButton: false
    }).then((willDelete) => {
    });
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
