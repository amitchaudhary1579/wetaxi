import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { Validation, PasswordValidation } from '../../helper/validation';
import { OperatorService } from '../../services';
import { ToastData, ToastOptions, ToastyService } from 'ng2-toasty';
import { Router } from '@angular/router';
@Component({
  selector: 'add-operator',
  templateUrl: './add-operator.component.html',
})
export class AddOperatorComponent implements OnInit {

  public loading = false;
  public primaryColour = "#ffffff";
  public secondaryColour = "#ffffff";
  position = 'bottom-right';
  addOperatorForm: FormGroup;
  isSubmitted: boolean = false;

  constructor(
    private validation: Validation,
    private operatorService: OperatorService,
    private toastyService: ToastyService,
    private router: Router,
    private fb: FormBuilder,
  ) {
    this.addOperatorForm = fb.group({
      first_name: new FormControl("", [Validators.required, Validators.pattern(this.validation.alphabaticOnly), Validators.minLength(2), Validators.maxLength(50)]),
      last_name: new FormControl("", [Validators.required, Validators.pattern(this.validation.alphabaticOnly), Validators.minLength(2), Validators.maxLength(50)]),
      email: new FormControl("", [Validators.required, Validators.pattern(this.validation.email)]),
      password: new FormControl("", [Validators.required, Validators.minLength(6), Validators.maxLength(16)]),
      confirmPassword: new FormControl("", [Validators.required, Validators.minLength(6), Validators.maxLength(16)]),
    }, {
      validator: PasswordValidation.MatchPassword // your custom validation method  
    });
   }

  ngOnInit() { }

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

  onFormSubmit() {
    this.isSubmitted = true;
    if (this.addOperatorForm.valid) {
      this.loading = true;
      delete this.addOperatorForm.value.confirmPassword;
      this.operatorService.addOperator(this.addOperatorForm.value)
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
