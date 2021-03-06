import { NgModule } from '@angular/core';

import { ShareModule } from '@vanx/framework';
import { FrameworkComponentModule } from '@vanx/framework/component';

import { UserIndexComponent } from './user-index/user-index.component';
import { UserPageComponent } from './user-page/user-page.component';
import { UserService } from './user.service';

@NgModule({
  imports: [ShareModule, FrameworkComponentModule],
  declarations: [UserIndexComponent, UserPageComponent],
  exports: [UserIndexComponent, UserPageComponent],
  providers: [UserService]
})
export class UserModule {}
