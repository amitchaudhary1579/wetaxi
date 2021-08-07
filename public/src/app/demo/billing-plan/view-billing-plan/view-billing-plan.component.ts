import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Validation } from '../../helper/validation';
import { BillingPlanService } from '../../services';
import { ToastData, ToastOptions, ToastyService } from 'ng2-toasty';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'view-billing-plan',
  templateUrl: './view-billing-plan.component.html',
})
export class ViewBillingplanComponent implements OnInit {

  public loading = false;
  public primaryColour = "#ffffff";
  public secondaryColour = "#ffffff";
  action: string = 'view';
  position = 'bottom-right';
  viewBillingPlanForm: FormGroup;
  isSubmitted: boolean = false;
  billingPlanData: any = {};
  billing_plan_id: any;

  constructor(
    private validation:Validation,
    private billingPlanService: BillingPlanService,
    private toastyService: ToastyService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.viewBillingPlanForm = new FormGroup({
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
      detail_en: new FormControl("", [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100)
      ]),
      detail_ch: new FormControl("", [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100)
      ]),
      detail_kh: new FormControl("", [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100)
      ]),
      billingType: new FormControl('percentage', [Validators.required]),
      chargePercentage: new FormControl('', []),
      chargeAmt: new FormControl('', [])
    });
    this.route.params.subscribe(params => {
      this.billing_plan_id = params.billing_plan_id;
    });
    this.getBillingPlanDetails();
  }

  getBillingPlanDetails() {
      this.loading = true;
      let billingPlanData = {
        'billing_plan_id': this.billing_plan_id
      }
      this.billingPlanService.getBillingPlanDetails(billingPlanData).subscribe(
        respone => {
          this.loading = false;
          this.billingPlanData = respone.data;
          if(this.billingPlanData.billingType == 'cash') {
            this.viewBillingPlanForm.get('chargeAmt').setValidators([Validators.required, Validators.minLength(1), Validators.maxLength(9), Validators.pattern(this.validation.integer)]);
            this.viewBillingPlanForm.get('chargeAmt').updateValueAndValidity({ emitEvent: false });
            this.viewBillingPlanForm.get('chargePercentage').setValidators([])
            this.viewBillingPlanForm.get('chargePercentage').updateValueAndValidity({ emitEvent: false });
          } else {
            this.viewBillingPlanForm.get('chargeAmt').setValidators([]);
            this.viewBillingPlanForm.get('chargeAmt').updateValueAndValidity({ emitEvent: false });
            this.viewBillingPlanForm.get('chargePercentage').setValidators([Validators.required, Validators.min(1), Validators.max(100), Validators.pattern(this.validation.integer)])
            this.viewBillingPlanForm.get('chargePercentage').updateValueAndValidity({ emitEvent: false });
          }
          this.viewBillingPlanForm.setValue({
            name_en: this.billingPlanData.name.en,
            name_ch: this.billingPlanData.name.zh,
            name_kh: this.billingPlanData.name.km,
            detail_en: this.billingPlanData.details.en,
            detail_ch: this.billingPlanData.details.zh,
            detail_kh: this.billingPlanData.details.km,
            billingType: this.billingPlanData.billingType,
            chargePercentage: this.billingPlanData.billingType == 'percentage' ? this.billingPlanData.chargeAmt : 0,
            chargeAmt: this.billingPlanData.billingType == 'cash' ? this.billingPlanData.chargeAmt : 0
          });
        },
        error => {
          this.loading = false;
          this.addToast({title:'Error', msg:error.message, timeout: 5000, theme:'default', position:'bottom-right', type:'error'});
        }
      );
  }

  onEdit() {
    this.action = 'edit';
  }

  onTypeChange() {
    if(this.viewBillingPlanForm.value.billingType == 'cash') {
      this.viewBillingPlanForm.get('chargeAmt').setValidators([Validators.required, Validators.minLength(1), Validators.maxLength(9), Validators.pattern(this.validation.integer)]);
      this.viewBillingPlanForm.get('chargeAmt').updateValueAndValidity({ emitEvent: false });
      this.viewBillingPlanForm.get('chargePercentage').setValidators([])
      this.viewBillingPlanForm.get('chargePercentage').updateValueAndValidity({ emitEvent: false });
      this.viewBillingPlanForm.patchValue({
        chargeAmt: ''
      })
    } else {
      this.viewBillingPlanForm.get('chargeAmt').setValidators([]);
      this.viewBillingPlanForm.get('chargeAmt').updateValueAndValidity({ emitEvent: false });
      this.viewBillingPlanForm.get('chargePercentage').setValidators([Validators.required, Validators.min(1), Validators.max(100), Validators.pattern(this.validation.integer)])
      this.viewBillingPlanForm.get('chargePercentage').updateValueAndValidity({ emitEvent: false });

      this.viewBillingPlanForm.patchValue({
        chargePercentage: ''
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

  onFormSubmit() {
    this.isSubmitted = true;
    if (this.viewBillingPlanForm.valid) {
      this.loading = true;
      this.viewBillingPlanForm.value.billing_plan_id = this.billing_plan_id;
      if(this.viewBillingPlanForm.value.billingType == 'cash') {
        this.viewBillingPlanForm.value.chargeAmt = this.viewBillingPlanForm.value.chargeAmt;
      } else {
        this.viewBillingPlanForm.value.chargeAmt = this.viewBillingPlanForm.value.chargePercentage;
      }

      let name:any = {};
      name.en = this.viewBillingPlanForm.value.name_en;
      name.zh = this.viewBillingPlanForm.value.name_ch;
      name.km = this.viewBillingPlanForm.value.name_kh;

      let details:any = {};
      details.en = this.viewBillingPlanForm.value.detail_en;
      details.zh = this.viewBillingPlanForm.value.detail_ch;
      details.km = this.viewBillingPlanForm.value.detail_kh;

      this.viewBillingPlanForm.value.name = name;
      this.viewBillingPlanForm.value.details = details;

      delete this.viewBillingPlanForm.value.chargePercentage;
      delete this.viewBillingPlanForm.value.name_en;
      delete this.viewBillingPlanForm.value.name_ch;
      delete this.viewBillingPlanForm.value.name_kh;
      delete this.viewBillingPlanForm.value.detail_en;
      delete this.viewBillingPlanForm.value.detail_ch;
      delete this.viewBillingPlanForm.value.detail_kh;

      this.billingPlanService.editBillingPlan(this.viewBillingPlanForm.value)
        .subscribe(next => {
            this.loading = false;
            this.isSubmitted = false;
            if (next.status_code == 200) {
              this.addToast({title:'Success', msg:next.message, timeout: 5000, theme:'default', position:'bottom-right', type:'success'});
              this.router.navigate(["/billing-plan/list-billing-plan"]);
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

