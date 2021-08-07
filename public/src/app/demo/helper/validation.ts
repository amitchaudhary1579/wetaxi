import { AbstractControl } from '@angular/forms';

export class Validation{
    email :any = /^([\w-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([\w-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/;
    password: any = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[$@$!%*#?&])[A-Za-z\d$@$!%*#?&]{6,}$/;
    alphabaticOnly: any = /^[a-zA-Z ]*$/;
    integer:any = /^[0-9]+$/;
    sapce_pattern = /^\S*$/;
    alpha_numeric: any = /^[A-Z0-9]+$/i;
    alpha_numeric_space:any =/^[A-Za-z0-9 _]*[A-Za-z0-9][A-Za-z0-9 _]*$/;
    float:any = /^[0-9.]+$/;
    url:any = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
    model: any = /^[a-zA-Z0-9 ]*$/;
    url_pattern = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
}

export class PasswordValidation {

    static MatchPassword(AC: AbstractControl) {
       const password = AC.get('password').value; // to get value in input tag
       const confirmPassword = AC.get('confirmPassword').value; // to get value in input tag
        if(confirmPassword!="" && password != confirmPassword) {
            AC.get('confirmPassword').setErrors( {MatchPassword: true} )
        } else {
            return null
        }
    }
}