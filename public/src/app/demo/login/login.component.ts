import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Validation } from '../helper/validation';
import { Router } from '@angular/router';
import { AuthService } from '../services';
import {ToastData, ToastOptions, ToastyService} from 'ng2-toasty';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})

export class LoginComponent implements OnInit {

  public loading = false;
  public primaryColour = "#ffffff";
  public secondaryColour = "#ffffff";
  
  position = 'bottom-right';
  loginForm: FormGroup;
  isSubmitted: boolean = false;
  @ViewChild('email') email: ElementRef;

  constructor(
    private router: Router,
    private validation: Validation,
    private authService: AuthService,
    private toastyService: ToastyService
  ) { }

  ngOnInit() {
    this.email.nativeElement.focus();
    this.loginForm = new FormGroup({
      email: new FormControl("", [Validators.required, Validators.pattern(this.validation.email)]),
      password: new FormControl("", [Validators.required, Validators.minLength(6), Validators.maxLength(10)])
    })
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

  onLoginFormSubmit() {
    this.isSubmitted = true;
    if (this.loginForm.valid) {
      this.loading = true;
      this.authService.doLogin(this.loginForm.value)
        .subscribe(next => {
            this.loading = false;
            this.isSubmitted = false;
            if (next.status_code == 200) {
              if(next.data.type == 'admin') {
                this.router.navigate(["/dashboard"]);
              } else {
                this.router.navigate(["/passenger/list-passenger"]);
              }
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
