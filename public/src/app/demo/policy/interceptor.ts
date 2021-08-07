import { Injectable } from '@angular/core';
import {
    HttpInterceptor,
    HttpRequest,
    HttpResponse,
    HttpErrorResponse,
    HttpHandler,
    HttpEvent,
    HttpHeaders
} from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { Router } from '@angular/router';
import { BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, finalize } from 'rxjs/operators';
@Injectable()
// export class Interceptor implements HttpInterceptor {
//     constructor(
//         private router: Router) {
//     }

//     intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
//         let authToken = localStorage.getItem('access_token');
//         if (!authToken) {
//             return next.handle(req);
//         } else {
//             const request = req.clone({
//                 headers: new HttpHeaders({
//                     authorization: authToken
//                 })
//             });

//             return next.handle(request);
//         }
//     }
// }   

export class HTTPStatus {
    private requestInFlight$: BehaviorSubject<boolean>;
    constructor() {
        this.requestInFlight$ = new BehaviorSubject(false);
    }

    setHttpStatus(inFlight: boolean) {
        this.requestInFlight$.next(inFlight);
    }

    getHttpStatus(): Observable<boolean> {
        return this.requestInFlight$.asObservable();
    }
}

@Injectable()
export class MyHttpInterceptor implements HttpInterceptor {
    constructor(private status: HTTPStatus, private route: Router) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // Clone the request to add the new header.
        const authToken = localStorage.getItem('access_token');
        if (authToken) {
            req = req.clone({
                headers: new HttpHeaders({
                    'authorization': authToken
                })
            });
        } else {
            req = req.clone();
        }

        return next.handle(req).pipe(
            map(event => {
                this.status.setHttpStatus(true);
                return event;
            }),
            catchError(error => {
                console.log('error: ', error);
                if (error.status === 401 || 403) {
                    localStorage.removeItem('adminData');
                    localStorage.removeItem('access_token');
                    this.route.navigate(['/login']);
                }
                // else if (error.status === 406) { 
                //     localStorage.removeItem('adminData');
                //     localStorage.removeItem('access_token');
                //     this.route.navigate(['/login']);
                // console.log('error: ', error.error);

                    return throwError(error.error);
                // }
                // if you use service observable so use this comment observable line
                // return Observable.throw(error);

            }),
            finalize(() => {
                this.status.setHttpStatus(false);
            })
        )
    }
}