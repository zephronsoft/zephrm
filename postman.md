
Testing the HRM API with Postman
1. Get an auth token
Request

Method: POST
URL: http://localhost:5000/api/auth/login
(or http://localhost:5175/api/auth/login if using the Vite proxy)
Headers: Content-Type: application/json
Body (raw JSON):
{
  "email": "hr@zephrons.com",
  "password": "CB230025@vb"
}
Response

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "...", "email": "hr@zephrons.com", "role": "HR_MANAGER", ... }
}
Copy the token value.


{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtbWx2MWV4bjAwMGFwbWJ3c2d2c2UyODUiLCJlbWFpbCI6ImhyQHplcGhyb25zLmNvbSIsInJvbGUiOiJIUl9NQU5BR0VSIiwiaWF0IjoxNzczMjYwODQ5LCJleHAiOjE3NzM4NjU2NDl9.IxE83-8TMZMJJz9-YRwfzonTToB-ezi8LUq8_-f6Hm4",
    "user": {
        "id": "cmmlv1exn000apmbwsgvse285",
        "email": "hr@zephrons.com",
        "role": "HR_MANAGER",
        "employee": {
            "id": "cmmlv1ey1000dpmbw8x8r08rc",
            "employeeId": "EMP0001",
            "userId": "cmmlv1exn000apmbwsgvse285",
            "firstName": "HR",
            "lastName": "Manager",
            "email": "hr@zephrons.com",
            "phone": null,
            "dateOfBirth": null,
            "gender": null,
            "address": "Test Address",
            "city": "Test City",
            "country": "India",
            "avatar": null,
            "departmentId": "cmmlv1ep60004pmbw3xbn310u",
            "positionId": "cmmlv1eqx0005pmbw1zx25xue",
            "managerId": null,
            "employmentType": "FULL_TIME",
            "status": "ACTIVE",
            "joiningDate": "2022-01-01T00:00:00.000Z",
            "leavingDate": null,
            "salary": 75000,
            "bankAccount": null,
            "taxId": null,
            "nationalId": null,
            "emergencyName": null,
            "emergencyPhone": null,
            "createdAt": "2026-03-11T09:52:25.321Z",
            "updatedAt": "2026-03-11T20:09:05.699Z"
        }
    }
}


2. Call protected endpoints
Example: GET positions

Method: GET
URL: http://localhost:5000/api/positions
Headers:
Content-Type: application/json
Authorization: Bearer <paste-your-token-here>

**Important for Postman:** Use `http://localhost:5000` (backend directly), not `http://localhost:5175`. The Vite proxy on 5175 is meant for browser requests; Postman works best hitting the backend on 5000.
3. Postman setup
Option A: Manual header
Create a new request.
In Headers, add:
Key: Authorization
Value: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (your token)
Option B: Environment variable
Create an environment (e.g. "HRM Local").
Add variable token and set it to your token.
In Headers, set:
Key: Authorization
Value: Bearer {{token}}
Option C: Tests script (auto-save token)
In the Login request, open the Tests tab.
Add:
var json = pm.response.json();
if (json.token) {
  pm.environment.set("token", json.token);
}
In other requests, use Authorization: Bearer {{token}}.
4. Base URL
- **Postman:** Use `http://localhost:5000` (backend directly). Ensure backend is running: `npm run dev --prefix backend`
- **Browser/app:** Uses `http://localhost:5175` via Vite proxy (both frontend + backend must run)

5. Troubleshooting 404 on /api/positions
- **Stop any other process on port 5000** – another app may be using it. In PowerShell: `Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force`
- Ensure backend is running: `npm run dev --prefix backend` (check for "HRM Server running on port 5000")
- Use `http://localhost:5000/api/positions` in Postman with a valid Bearer token

6. Example requests
Method	URL	Auth
POST	/api/auth/login	No
GET	/api/positions	Yes
GET	/api/departments	Yes
GET	/api/employees	Yes (admin)
GET	/api/employees/me	Yes
GET	/api/status	No (lists healthy/unhealthy APIs)
GET	/api/status/page	No (HTML page with API status)

7. Test credentials
Role	Email	Password
HR	hr@zephrons.com	CB230025@vb
Admin	admin@hrm.com	(from seed)
Ensure the backend is running on port 5000 before testing.