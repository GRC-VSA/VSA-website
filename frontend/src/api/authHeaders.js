/************************************************************************************************************************************
Brief:
- This function gets JWT token of the user account in the localStorage
- And return the Authentication header "Authorization: `Bearer ${token}" that backend needs
 
Explain: 
- After a user logs in, the backend sends a unique JWT token for their account to the frontend.
- The token has hashed information such as roles, name, and email of the account.
- The frontend stores that JWT token in "localStorage" (Should store the token in Cookies instead, for security).

- When the user take actions that only permit specific roles to do (ex: Create Event & Delete Events only permit officers).
- The backend requires the JWT token in the header of the POST METHOD, when the frontend sends the POST request to the backend 
- So the backend can confirm that the user, indeed, can take the action.

Usage:
- This function is used right when the user is taking actions that only permit certain roles.
- It is called by the "createEvent" method in "./Events.js"
- The "createEvent" method put the "Authorization: `Bearer ${token}" that this function returns
as the header of the POST request for creating events.
***********************************************************************************************************************************/

export function getTokenforAuthHeader() {
  const token = localStorage.getItem("token");

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`
  };
}
