import { Injectable } from '@angular/core';
import { switchMap, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { NgxRolesService, NgxPermissionsService } from 'ngx-permissions';
import { User } from '@core/models/interface';

@Injectable({
  providedIn: 'root',
})
export class StartupService {
  constructor(
    private rolesService: NgxRolesService,
    private permissonsService: NgxPermissionsService,
    private authService: AuthService
  ) {}

  /**
   * Load the application only after get the menu or other essential informations
   * such as permissions and roles.
   */

  // load(user: User) {
  //   return this.setPermissions(user);
  // }

  load() {
    return this.authService
      .change()
      .pipe(
        tap((user) => {
          return this.setPermissions(user);
        })
      )
      .subscribe();
  }

  private setPermissions(user: User) {
    const role: any = {};
    user['roles']?.forEach((e: any) => {
      this.permissonsService.loadPermissions(user.permissions!);
      this.rolesService.flushRoles();
      const name = e['name'];
      role[name] = user.permissions;
    });
    this.rolesService.addRolesWithPermissions(role);
  }
}
