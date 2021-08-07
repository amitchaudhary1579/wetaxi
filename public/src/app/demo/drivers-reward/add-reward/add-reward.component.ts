import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { Validation, PasswordValidation } from '../../helper/validation';
import { OperatorService } from '../../services';
import { ToastData, ToastOptions, ToastyService } from 'ng2-toasty';
import { Router, ActivatedRoute } from '@angular/router';
import { RewardService } from '../../services/reward.service';
@Component({
  selector: 'app-add-reward',
  templateUrl: './add-reward.component.html'
})
export class AddRewardComponent implements OnInit {

  public driver_id:any;
  public loading = false;
  public primaryColour = "#ffffff";
  public secondaryColour = "#ffffff";
  position = 'bottom-right';
  addRewardForm: FormGroup;
  isSubmitted: boolean = false;
  Rewardtype = [{label: "Birthday", value: "birthday"},{label: "Other", value: "other"}];
  Gifttype = [{label: "Cash", value: "cash"},{label: "Wallet", value: "wallet"},{label: "Other", value: "other"}];
  
  constructor(
    private validation: Validation,
    private operatorService: OperatorService,
    private rewardService: RewardService,
    private toastyService: ToastyService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
  ) {
    this.addRewardForm = fb.group({
      // giftName: new FormControl("", [Validators.required, Validators.pattern(this.validation.alphabaticOnly), Validators.minLength(2), Validators.maxLength(50)]),
      name_en: new FormControl("", [
        Validators.required,
        Validators.pattern(this.validation.alphabaticOnly),
        Validators.minLength(2),
        Validators.maxLength(50)
      ]),
      name_ch: new FormControl("", [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50)
      ]),
      name_kh: new FormControl("", [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50)
      ]),
      amount: new FormControl("", [
        Validators.required,
        Validators.minLength(1),
        Validators.maxLength(8),
        Validators.pattern(this.validation.integer)
      ]),
      type: new FormControl("", [Validators.required]),
      giftType: new FormControl("", [Validators.required]),
    });
   }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.driver_id = params.driver_id;
    });
   }


   selectChange(e){
     if(e.value == 'other'){
      this.addRewardForm.removeControl('amount');
      // this.addRewardForm.addControl('giftName', new FormControl("", [Validators.required, Validators.pattern(this.validation.alphabaticOnly), Validators.minLength(2), Validators.maxLength(50)]));
     }else{
      this.addRewardForm.addControl('amount', new FormControl("", [Validators.required, Validators.minLength(1),Validators.maxLength(8),Validators.pattern(this.validation.integer)]));
      // this.addRewardForm.removeControl('giftName');
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

  onFormSubmit() {
    this.isSubmitted = true;
    if (this.addRewardForm.valid) {
      this.loading = true;
      let type:any = {};
      type.en = this.addRewardForm.value.name_en;
      type.zh = this.addRewardForm.value.name_ch;
      type.km = this.addRewardForm.value.name_kh;

      // if (this.addRewardForm.value.giftType === "cash") {
        let form_data_submit ={...this.addRewardForm.value, "driverId": this.driver_id ,name :type} 
      // }else{
      //   let form_data_submit ={...this.addRewardForm.value, "driverId": this.driver_id} 
      // }
      this.rewardService.AddDriversReward(form_data_submit)
        .subscribe(next => {
            this.loading = false;
            this.isSubmitted = false;
            if (next.status_code == 200) {
              this.addToast({title:'Success', msg:next.message, timeout: 5000, theme:'default', position:'bottom-right', type:'success'});
              this.router.navigate(["/reward/driver-reward"]);
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
