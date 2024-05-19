export async function validate(token: string, secret: string, ip: string) {
  const formData = new FormData();
  formData.append('response', token);
  formData.append('secret', secret);
  formData.append('remoteip', ip);

  const URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

  const result = await fetch(URL, {
		body: formData,
		method: 'POST',
	});

  const outcome = await result.json();

  if (outcome.success) {
    return true;
  } else {
    console.error(JSON.stringify(outcome))
    return false;
  }
}