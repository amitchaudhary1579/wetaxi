import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Validation } from '../../helper/validation';
import { OperatorService } from '../../services';
import { ToastData, ToastOptions, ToastyService } from 'ng2-toasty';
import { Router, ActivatedRoute } from '@angular/router';
@Component({
  selector: 'view-operator',
  templateUrl: './view-operator.component.html',
})
export class ViewOperatorComponent implements OnInit {

  public loading = false;
  public primaryColour = "#ffffff";
  public secondaryColour = "#ffffff";
  action: string = 'view';
  position = 'bottom-right';
  viewOperatorForm: FormGroup;
  isSubmitted: boolean = false;
  operatorData: any = {};
  operator_id: any;

  constructor(
    private validation:Validation,
    private operatorService: OperatorService,
    private toastyService: ToastyService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.viewOperatorForm = new FormGroup({
      first_name: new FormControl("", [Validators.required, Validators.pattern(this.validation.alphabaticOnly), Validators.minLength(2), Validators.maxLength(50)]),
      last_name: new FormControl("", [Validators.required, Validators.pattern(this.validation.alphabaticOnly), Validators.minLength(2), Validators.maxLength(50)]),
      email: new FormControl("", [Validators.required, Validators.pattern(this.validation.email)]),
      password: new FormControl("", [Validators.required, Validators.minLength(6), Validators.maxLength(16)])
    });
    this.route.params.subscribe(params => {
      this.operator_id = params.operator_id;
    });
    this.getOperatorDetails();
  }

  onEdit() {
    this.action = 'edit';
  }

  getOperatorDetails() {
    this.loading = true;
    let operatorData = {
      'operator_id': this.operator_id
    }
    this.operatorService.getOperatorDetails(operatorData).subscribe(
      respone => {
        this.loading = false;
        this.operatorData = respone.data;
        this.viewOperatorForm.setValue({
          first_name: this.operatorData.first_name,
          last_name: this.operatorData.last_name,
          email: this.operatorData.email,
          password: this.operatorData.password
        })
      },
      error => {
        this.loading = false;
        this.addToast({title:'Error', msg:error.message, timeout: 5000, theme:'default', position:'bottom-right', type:'error'});
      }
    );
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

  onDelete() {
    this.loading = true;
    let operatorData = {
      'operator_id': this.operator_id
    }
    this.operatorService.deleteOperator(operatorData).subscribe(
      next => {
        this.loading = false;
        if(next.status_code == 200) {
        } this.addToast({title:'Success', msg:next.message, timeout: 5000, theme:'default', position:'bottom-right', type:'success'});
        this.router.navigate(["/operator/list-operator"]);
      },
      error => {
        this.loading = false;
        this.addToast({title:'Error', msg:error.message, timeout: 5000, theme:'default', position:'bottom-right', type:'error'});
      }
    );
  }

  onFormSubmit() {
    this.isSubmitted = true;
    if (this.viewOperatorForm.valid) {
      this.loading = true;
      this.viewOperatorForm.value.operator_id = this.operator_id;
      this.operatorService.editOperator(this.viewOperatorForm.value)
        .subscribe(next => {
            this.loading = false;
            this.isSubmitted = false;
            if (next.status_code == 200) {
              this.addToast({title:'Success', msg:next.message, timeout: 5000, theme:'default', position:'bottom-right', type:'success'});
              this.router.navigate(["/operator/list-operator"]);
            } else {
              this.addToast({title:'Error', msg:next.message, timeout: 5000, theme:'default', position:'bottom-right', type:'error'});
            }
          },
          error => {
            this.loading = false;
            this.isSubmitted = false;
            this.addToast({title:'Error', msg:error.message, timeout: 5000, theme:'default', position:'bottom-right', type:'error'});
          })
    }
  }

}

