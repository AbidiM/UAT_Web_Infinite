import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { Observable, Subject, takeUntil } from 'rxjs';
import { selectRoleById } from 'src/app/store/Role/role-selector';
import { addRolelist, getRoleById, updateRolelist } from 'src/app/store/Role/role.actions';
import { Modules, Permission, RoleListModel } from 'src/app/store/Role/role.models';

@Component({
  selector: 'app-form-role',
  templateUrl: './form-role.component.html',
  styleUrl: './form-role.component.css'
})
export class FormRoleComponent implements OnInit {
  
  @Input() type: string;
  roleForm: UntypedFormGroup;
  private destroy$ = new Subject<void>();
  Rolelist$: Observable<any[]>;
  role: RoleListModel;
  claims: { claimType: Modules; claimValue: Permission[] }[] = [];

  submitted: any = false;
  error: any = '';
  isEditing: boolean = false;
  ALLPermissionChecked: boolean = false;
  ALLModulesChecked : boolean = false;

  public Permission: Permission;
  public Module: Modules;



  constructor(
    private formBuilder: UntypedFormBuilder,
    private route: ActivatedRoute, 
    private router: Router,
    public store: Store) {
      
      this.roleForm = this.formBuilder.group({
        id: [''],
        name: ['', Validators.required],
        claims: [[]],
        status: [1]
        
      });
     }
  // set the currenr year
  year: number = new Date().getFullYear();
   
 // Extract the keys from Modules and Permissions enums
 moduleKeys = Object.keys(Modules).filter(key => isNaN(Number(key))); // Get the module names
 permissionKeys = Object.keys(Permission).filter(key => isNaN(Number(key))); // Get the permission names

  ngOnInit() {
        

    const roleId = this.route.snapshot.params['id'];
    console.log('role ID from snapshot:', roleId);
    if (roleId) {
      // Dispatch action to retrieve the role by ID
      this.store.dispatch(getRoleById({ RoleId: roleId }));
      
      // Subscribe to the selected role from the store
      this.store
        .pipe(select(selectRoleById(roleId)), takeUntil(this.destroy$))
        .subscribe(role => {
          if (role) {
            console.log('Retrieved role:', role);
            this.role = role;
            this.roleForm.patchValue(role);
            this.isEditing = true;

          }
        });
    }
   
  }
  shouldDisableCheckbox(module: string, permission: string): boolean {
    // Check if all modules are checked
    if (this.ALLModulesChecked) {
        return true; // Disable all checkboxes in this case
    }

    
    const moduleClaim = this.claims.find(claim => claim.claimType === Modules[module as keyof typeof Modules]);
    if (moduleClaim && moduleClaim.claimValue.includes(Permission.All)) {
        return permission !== 'All'; // Disable all permissions except for the "All" permission for this module
    }

    // Allow other checkboxes to be enabled by default
    return false;
}



  /**
   * On submit form
   */
  onSubmit() {
    console.log('Form status:', this.roleForm.status);
    console.log('Form errors:', this.roleForm.errors);
    if (this.roleForm.valid) {
      console.log('i am on onSubmit');
      console.log(this.roleForm.value);
      console.log('Form status:', this.roleForm.status);
      console.log('Form errors:', this.roleForm.errors);
          
      const newData = this.roleForm.value;
      
          if(!this.isEditing)
            {                   
              //Dispatch Action
              this.store.dispatch(addRolelist({ newData}));
        }
        else
        {
          console.log('updating role');
          this.store.dispatch(updateRolelist({ updatedData: newData }));
        }
    } else {
      // Form is invalid, display error messages
      console.log('Form is invalid');
      this.roleForm.markAllAsTouched();
    }
  }
  
  hasPermission(module: string, permission: string): boolean {
    const moduleEnum = Modules[module as keyof typeof Modules];
    const permissionEnum = Permission[permission as keyof typeof Permission];
  
    const claim = this.role.claims.find((claim) => claim.claimType === moduleEnum);
    return claim ? claim.claimValue.includes(permissionEnum) : false;
  }

  patchClaimsToCheckboxes(claims : any[]) {
    claims.forEach(claim => {
        // const moduleKey = Modules[claim.claimType];
        const claimValue = claim.claimValue;

        // Check if "All" permission is present for this module
        const hasAllPermission = claimValue.includes(Permission.All);

        // If the "All" permission is present, check the "All" checkbox for the module
        if (claim.claimType === Modules.All) {
            this.ALLModulesChecked = hasAllPermission;
        }
         else
          {
            // For other modules, set the ALL permission checkbox state
            const existingClaim = this.claims.find(c => c.claimType === claim.claimType);
            if (existingClaim) {
                existingClaim.claimValue = claimValue; // Set the permissions for the module
            } else {
                // If the claim doesn't exist, add it
                this.claims.push({ claimType: claim.claimType, claimValue });
            }
        }
    });

    // Update the form's claims value
    this.roleForm.patchValue({ claims: this.claims });
    console.log(this.claims); // Log claims for debugging
}

  toggleGlobalAll(checked: boolean): void {
    if (checked) {
        // If "All Modules" is checked, set all claims to 'All' and disable other checkboxes
        this.claims = [];
        this.claims.push({ claimType: Modules.All, claimValue: [Permission.All] });
        this.ALLModulesChecked = true;

      
    } else {
        // Uncheck all if "All Modules" is unchecked
        this.ALLModulesChecked = false;
        this.ALLPermissionChecked = false;
        this.claims = []
          }
    // Update the form's claims value
    this.roleForm.patchValue({ claims: this.claims });
    console.log(this.claims); // Log claims for debugging
}

  togglePermission(moduleKey: string, permissionKey: string, event: any): void {

    const module = Modules[moduleKey as keyof typeof Modules]; // Get the enum value for the module
    const permission = Permission[permissionKey as keyof typeof Permission]; // Get the enum value for the permission
    
    const checked = event.target.checked;
    const claimIndex = this.claims.findIndex(c => c.claimType === module); // Find the claim for the module

    if (permission === Permission.All) {
        // If the "All" permission checkbox is checked
        if (checked) {
           this.ALLPermissionChecked = true;
           if(moduleKey == 'All'){
              this.ALLModulesChecked = true;
           }
            // Clear other permissions for this module
            if (claimIndex === -1) {
                // If the module doesn't exist in claims, add a new claim
                this.claims.push({ claimType: module, claimValue: [Permission.All] });
            } else {
                // If the module exists, set its permissions to "All"
                this.claims[claimIndex].claimValue = [Permission.All];
            }
        } else {
            // If the "All" checkbox is unchecked, allow other permissions to be checked
            this.ALLPermissionChecked = false;
            if(moduleKey == 'All'){
              this.ALLModulesChecked = false;
           }
            if (claimIndex !== -1) {
                const existingClaim = this.claims[claimIndex];
                existingClaim.claimValue = existingClaim.claimValue.filter(p => p !== Permission.All);
                
                // If no permissions remain for this module, remove the claim altogether
                if (existingClaim.claimValue.length === 0) {
                    this.claims.splice(claimIndex, 1);
                }
            }
        }
    } else {
        // For other permissions
        if (checked) {
            // If the checkbox is checked, add the permission to the claims
            if (claimIndex === -1) {
                // If the module doesn't exist in claims, add a new claim
                this.claims.push({ claimType: module, claimValue: [permission] });
            } else {
                // If the module exists, add the permission to the existing claim
                const existingClaim = this.claims[claimIndex];
                if (!existingClaim.claimValue.includes(permission)) {
                    existingClaim.claimValue.push(permission);
                }
            }
        } else {
            // If the checkbox is unchecked, remove the permission from the claims
            if (claimIndex !== -1) {
                const existingClaim = this.claims[claimIndex];
                existingClaim.claimValue = existingClaim.claimValue.filter(p => p !== permission);
                
                // If no permissions remain for this module, remove the claim altogether
                if (existingClaim.claimValue.length === 0) {
                    this.claims.splice(claimIndex, 1);
                }
            }
        }
    }

    // Update the form's claims value
    this.roleForm.patchValue({ claims: this.claims });
    console.log(this.claims); // Log claims for debugging
}
checkExistance(moduleKey : string): boolean {
  const module = Modules[moduleKey as keyof typeof Modules];
  return this.claims.find(c => c.claimType === module)?.claimValue.includes(Permission.All)|| false;
}
toggleModule(moduleKey: string, event: any): void {
    const checked = event.target.checked;
    const module = Modules[moduleKey as keyof typeof Modules];

    if (checked) {
        // If "All" is checked, set the claims for this module
        this.claims = this.claims.filter(c => c.claimType !== module); // Remove existing claims for this module
        this.claims.push({ claimType: module, claimValue: [Permission.All] }); // Add only the All permission
        this.permissionKeys.forEach(permission => {
            const checkbox = document.querySelector(`#permission-${moduleKey}-${permission}`);
            if (checkbox) {
                (checkbox as HTMLInputElement).disabled = true; // Disable all specific permissions
            }
        });
    } else {
        // If "All" is unchecked, remove it from claims
        this.claims = this.claims.filter(c => c.claimType !== module);
        this.permissionKeys.forEach(permission => {
            const checkbox = document.querySelector(`#permission-${moduleKey}-${permission}`);
            if (checkbox) {
                (checkbox as HTMLInputElement).disabled = false; // Enable all specific permissions
            }
        });
    }

    // Update the form's claims value
    this.roleForm.patchValue({ claims: this.claims });
    console.log(this.claims); // Log claims for debugging
}


  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  onCancel(){
    console.log('Form status:', this.roleForm.status);
    console.log('Form errors:', this.roleForm.errors);
    this.roleForm.reset();
    this.router.navigateByUrl('/private/roles');
  }

}

   