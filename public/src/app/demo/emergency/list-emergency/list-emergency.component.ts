import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';
import { EmergencyService, AuthService } from '../../services';
import { ToastData, ToastOptions, ToastyService } from 'ng2-toasty';
import Swal from 'sweetalert2';

class Emergency {
  phone_number: string;
}

class DataTablesResponse {
  data: any[];
  draw: number;
  recordsFiltered: number;
  recordsTotal: number;
}

@Component({
  selector: 'list-emergency',
  templateUrl: './list-emergency.component.html'
})
export class ListEmergencyComponent implements AfterViewInit, OnInit { 

  public loading = false;
  public primaryColour = "#ffffff";
  public secondaryColour = "#ffffff";
  position = 'bottom-right';
  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;
  dtOptions: DataTables.Settings = {};
  dtTrigger: Subject<any> = new Subject();
  emergencies: Emergency[];
  public operatorDisable = false;
  
  constructor(
    private emergencyService: EmergencyService,
    private authService: AuthService,
    private toastyService: ToastyService
  ) { }

  ngOnInit() {
    let admindata = JSON.parse(localStorage.getItem('adminData'));
    if (admindata.type == "operator") {
      this.operatorDisable = true;
    } else {
      this.operatorDisable = false;
    }
    this.authService.clearDataTableData("DataTables_emergency_management");
    this.loading = true;
    this.dtOptions = {
      pagingType: "full_numbers",
      pageLength: 10,
      serverSide: true,
      processing: false,
      stateSave: true,
      stateSaveCallback: function(settings, data) {
        localStorage.setItem(
          "DataTables_emergency_management",
          JSON.stringify(data)
        );
      },
      stateLoadCallback: function(settings) {
        return JSON.parse(localStorage.getItem("DataTables_emergency_management"));
      },
      ajax: (dataTablesParameters: any, callback) => {
        dataTablesParameters.search.value = dataTablesParameters.search.value.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '');
        this.emergencyService.ListOfAllEmergencies(dataTablesParameters).subscribe(
          resp => {
            this.loading = false;
            this.emergencies = resp.data;
            callback({
              recordsTotal: resp.recordsTotal,
              recordsFiltered: resp.recordsFiltered,
              data: []
            });
          },
          error => {
            this.loading = false;
            this.addToast({title:'Error', msg:error.message, timeout: 5000, theme:'default', position:'bottom-right', type:'error'});
          }
        );
      },
      columns: [
        { data: "autoIncrementID" },
        { data: "phoneNumber" },  
        { data: "actions", orderable: false, searchable: false }
      ]
    };
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
      text: 'You do not have a permission add info',
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
