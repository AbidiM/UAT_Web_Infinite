import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { Subject, takeUntil } from 'rxjs';
import { selectEmployeeById } from 'src/app/store/employee/employee-selector';
import { addEmployeelist, getEmployeeById, updateEmployeelist } from 'src/app/store/employee/employee.action';
import { Modules, Permission } from 'src/app/store/Role/role.models';

@Component({
  selector: 'app-form-employee',
  templateUrl: './form-employee.component.html',
  styleUrl: './form-employee.component.css'
})
export class FormEmployeeComponent implements OnInit{
  
  @Input() type: string;
  employeeForm: UntypedFormGroup;
  isEditing: boolean = false;
  isCollapsed: boolean;
  private destroy$ = new Subject<void>();
  public firstColleaps:boolean = false;
  public secondColleaps:boolean = false;
  public bothColleaps:boolean = false;
  isFirstOpen:boolean = true;
  banks : any[] = [{id: '1', name:'BIAT'},{id: '2', name:'BT'}];
  roles: any[] = [{id:'1', name: 'ADMIN'}, {id:'2', name: 'MERCHANT'}, {id:'3', name: 'EMPLOYEE'}]
  public Permission: Permission;
  public Module: Modules;

  // Extract the keys from Modules and Permissions enums
moduleKeys = Object.keys(Modules).filter(key => isNaN(Number(key))); // Get the module names
permissionKeys = Object.keys(Permission).filter(key => isNaN(Number(key))); // Get the permission names

// The employee's role and its claims that will be displayed
role = {
  claims: [
   
    {
      claimType: Modules.Employees,
      claimValue: [Permission.ViewAll,Permission.Create,Permission.Update,Permission.Delete],
    }
    ,
    {
      claimType: Modules.Merchants,
      claimValue: [Permission.ViewAll,Permission.Create,Permission.Update,Permission.Delete],
    },
    {
      claimType: Modules.Customers,
      claimValue: [Permission.ViewAll,Permission.Create,Permission.Update,Permission.Delete],
    }
    ,
    {
      claimType: Modules.Coupons,
      claimValue: [Permission.ViewAll,Permission.Create,Permission.Update,Permission.Delete,Permission.Download,Permission.Filter,Permission.Print],
    }
    ,
    {
      claimType: Modules.GiftCards,
      claimValue: [Permission.ViewAll,Permission.Create,Permission.Update,Permission.Delete,Permission.Download,Permission.Filter,Permission.Print],
    }
    ,
    {
      claimType: Modules.Contracts,
      claimValue: [Permission.ViewAll,Permission.Create,Permission.Update,Permission.Delete,Permission.Download,Permission.Filter,Permission.Print],
    }
    ,
    
    {
      claimType: Modules.CustomerWallet,
      claimValue: [Permission.ViewAll,Permission.Create,Permission.Update,Permission.Delete,Permission.Download,Permission.Filter,Permission.Print],
    }
    ,
    {
      claimType: Modules.CustomerInvoice,
      claimValue: [Permission.ViewAll,Permission.Create,Permission.Update,Permission.Delete,Permission.Download,Permission.Filter,Permission.Print],
    }
    ,
    {
      claimType: Modules.CustomerReviews,
      claimValue: [Permission.ViewAll],
    },
    {
      claimType: Modules.SystemAdministration,
      claimValue: [Permission.ViewAll,Permission.Create,Permission.Update,Permission.Delete],
    },

    // Add more claims for other modules
  ],
};


  constructor(
    private formBuilder: UntypedFormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private store: Store){
      
      this.employeeForm = this.formBuilder.group({
        id: [''],
        username: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: ['', Validators.required],
        phone:['',Validators.required], //Validators.pattern(/^\d{3}-\d{3}-\d{4}$/)*/],
        country:[''],
        city:[''],
        area:[''], 
        bankAccountNumber: [''],
        bankName:[''],
        role:['']
  
      });
    }
  
  
  ngOnInit() {
    
    const employeeId = this.route.snapshot.params['id'];
    console.log('employee ID from snapshot:', employeeId);
    if (employeeId) {
      // Dispatch action to retrieve the employee by ID
      this.store.dispatch(getEmployeeById({ employeeId }));
      
      // Subscribe to the selected employee from the store
      this.store
        .pipe(select(selectEmployeeById(employeeId)), takeUntil(this.destroy$))
        .subscribe(employee => {
          if (employee) {
            console.log('Retrieved employee:', employee);
            // Patch the form with employee data
          
            this.employeeForm.patchValue(employee);
          
            this.isEditing = true;

          }
        });
    }
   
    
  }
  onSubmit() {
    console.log('Form status:', this.employeeForm.status);
    console.log('Form errors:', this.employeeForm.errors);
    if (this.employeeForm.valid) {
      console.log('i am on onSubmit');
      console.log(this.employeeForm.value);
      console.log('Form status:', this.employeeForm.status);
      console.log('Form errors:', this.employeeForm.errors);
      
      
      const newData = this.employeeForm.value;
      console.log(newData);
      if(!this.isEditing)
        {
            delete newData.id;
            
            delete newData.role;
            this.store.dispatch(addEmployeelist({ newData }));
        }
        else{
          delete newData.password;
          this.store.dispatch(updateEmployeelist({ updatedData: newData }));
  
        }
      //Dispatch Action
      
    } else {
      // Form is invalid, display error messages
      console.log('Form is invalid');
      this.employeeForm.markAllAsTouched();
    }
  }
  onPhoneNumberChanged(phoneNumber: string) {
    this.employeeForm.get('phone').setValue(phoneNumber);
  }




hasPermission(module: string, permission: string): boolean {
  const moduleEnum = Modules[module as keyof typeof Modules];
  const permissionEnum = Permission[permission as keyof typeof Permission];

  const claim = this.role.claims.find((claim) => claim.claimType === moduleEnum);
  return claim ? claim.claimValue.includes(permissionEnum) : false;
}

togglePermission(module: string, permission: string, event: any): void {
  const moduleEnum = this.Module[module as keyof typeof Modules];
  const permissionEnum = this.Permission[permission as keyof typeof Permission];

  const claim = this.role.claims.find((claim) => claim.claimType === moduleEnum);
  if (claim) {
    if (event.target.checked) {
      // Add the permission
      claim.claimValue.push(permissionEnum);
    } else {
      // Remove the permission
      claim.claimValue = claim.claimValue.filter((perm) => perm !== permissionEnum);
    }
  } else {
    // If there's no claim for this module, create one and add the permission
    this.role.claims.push({
      claimType: moduleEnum,
      claimValue: [permissionEnum],
    });
  }
}





  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  onCancel(){
    this.employeeForm.reset();
    this.router.navigateByUrl('/private/employees');
  }

}
