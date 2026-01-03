// resources/js/routes/profile.ts

export function edit() {
  return { url: '/user/profile/edit' };
}

export function update() {
  return { url: '/user/profile' }; // calls ProfileController@update in Laravel
}

export function updatePassword() {
  return { url: '/user/profile/password' }; // calls ProfileController@updatePassword
}
