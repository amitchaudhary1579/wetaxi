import {Directive} from '@angular/core';
import {NG_VALIDATORS, Validator, FormControl} from '@angular/forms';


@Directive({
    selector: '[requireFile]',
    providers: [
        { provide: NG_VALIDATORS, useExisting: FileValidator, multi: true },
    ]
})
export class FileValidator implements Validator {
    static validate(c: FormControl): { [key: string]: any } {
      return c.value == null || c.value.length == 0 ? { 'required' : true} : null;
    }

    validate(c: FormControl): {[key: string]: any} {
      return FileValidator.validate(c);
    }

    validateImage(name: String) {
        let validFormats = ['png', 'jpg', 'jpeg', 'pdf'];
        let ext = name.substring(name.lastIndexOf('.') + 1);
        if (validFormats.indexOf(ext.toLowerCase()) === -1) {
            // if (ext.toLowerCase() == 'png') {
            return false;
        }
        else {
            return true;
        }
    }
}