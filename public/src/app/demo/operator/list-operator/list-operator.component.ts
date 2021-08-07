import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';
import { OperatorService, AuthService } from '../../services';
import { ToastData, ToastOptions, ToastyService } from 'ng2-toasty';
import Swal from 'sweetalert2';

class Operator {
  first_name: string;
  last_name: string;
  email: string;
  isActive: string;
}

class DataTablesResponse {
  data: any[];
  draw: number;
  recordsFiltered: number;
  recordsTotal: number;
}

@Component({
  selector: 'list-operator',
  templateUrl: './list-operator.component.html'
})
export class ListOperatorComponent implements AfterViewInit, OnInit {

  public loading = false;
  public primaryColour = "#ffffff";
  public secondaryColour = "#ffffff";
  position = 'bottom-right';
  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;
  dtOptions: DataTables.Settings = {};
  dtTrigger: Subject<any> = new Subject();
  operators;

  constructor(
    private operatorService: OperatorService,
    private authService: AuthService,
    private toastyService: ToastyService
  ) { }

  ngOnInit() {
    this.loading = true;
    this.authService.clearDataTableData("DataTables_operator_management");
    this.dtOptions = {
      pagingType: "full_numbers",
      pageLength: 10,
      serverSide: true,
      processing: false,
      stateSave: true,
      stateSaveCallback: function (settings, data) {
        localStorage.setItem(
          "DataTables_operator_management",
          JSON.stringify(data)
        );
      },
      stateLoadCallback: function (settings) {
        return JSON.parse(localStorage.getItem("DataTables_operator_management"));
      },
      ajax: (dataTablesParameters: any, callback) => {
        dataTablesParameters.search.value = dataTablesParameters.search.value.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '');
        this.operatorService.listAllOperators(dataTablesParameters).subscribe(
          resp => {
            this.loading = false;
            this.operators = resp.data;
            // this.operators.map(element => {
            //   if (element.canChangePassword) {
            //     element.isCheck = true;
            //   } else {
            //     element.isCheck = false;
            //   }
            // });
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
        { data: "permission_allow", orderable: false, searchable: false },
        { data: "first_name" },
        { data: "last_name" },
        { data: "email" },
        { data: "isActive", searchable: false },
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

  isAllSelected(id,status) {
    this.operatorService.changePasswordStatus({operator_id:id,change_password:status}).subscribe(
      next => {
        this.rerender();
        if (next.status == 200) {
          this.addToast({ title: 'Success', msg: next.message, timeout: 5000, theme: 'default', position: 'bottom-right', type: 'success' });
        } else {
          this.addToast({ title: 'Error', msg: next.message, timeout: 5000, theme: 'default', position: 'bottom-right', type: 'error' });
        }
      },
      error => {
        this.addToast({ title: 'Error', msg: error.message, timeout: 5000, theme: 'default', position: 'bottom-right', type: 'error' });
      });
  }

  activeInactiveOperator(operator: any) {
    let text;
    if (operator.isActive) {
      text = 'You want to inactive this operator ?';
    } else {
      text = 'You want to active this operator ?';
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
          'operator_id': operator._id
        }
        this.operatorService.activeInactiveOperator(data).subscribe(
          next => {
            if (next.status_code == 200) {
              this.rerender();
              if (operator.isActive) {
                Swal('Success', "Operator inactivated successfully.", 'success');
              } else {
                Swal('Success', "Operator activated successfully.", 'success');
              }
            } else {
              Swal('Error', "Operator status is not updated.", 'error');
            }
          },
          error => {
            Swal('Error', "Operator status is not updated.", 'error');
          }
        );
      } else { }
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
