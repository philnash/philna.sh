---
layout: post
title: "Testing signed and encrypted cookies in Rails"
tags:
  - ruby
  - rails
  - testing
image: posts/railscookies
image_alt: "The Ruby on Rails logo surrounded by cookies"
---

Recently I've been refactoring the tests for [a gem I maintain](https://github.com/twilio/authy-devise) and I needed to test that it sets the right cookies at the right time. But the cookies in use in the gem are signed cookies and that caused a slight hiccup for me. I'd never tested the value in a signed cookie before and it wasn't immediately obvious what to do.

So I thought I would share what I found out in case it helps.

## Cookies on Rails

In Rails applications there are three flavours of cookies available: simple session cookies, signed cookies and encrypted cookies. You can set any of these by using the `cookies` object in a controller, like this:

```ruby
class CookiesController <  ApplicationController
  def index
    cookies["simple"] = "Hello, I am easy to read."
    cookies.signed["protected"] = "Hello, I can be read, but I can't be tampered with."
    cookies.encrypted["private"] = "Hello, I can't be read or tampered with."
  end
end
```

### Simple cookies

Simple cookies are made up of plain text. If you inspected the cookie above called "simple" in the browser you would see the text "Hello, I am easy to read."

Simple cookies are ok for storing data that doesn't really matter. The end user can read and change it and your application shouldn't be affected.

### Signed cookies

Signed cookies are not sent to the browser as plain text. Instead they comprise of a payload and signature separated by two dashes `--`. Before the dashes, the payload is [base 64 encoded data](https://en.wikipedia.org/wiki/Base64). To read the data you can base 64 decode it. This data isn't secret, but it can't be tampered with because the second part of the cookie is a signature. The signature is created by taking an HMAC SHA1 digest of the application's `secret_key_base` and the data in the cookie. If the contents of the cookie are changed when you try to read the cookie, the signature will no longer match the contents and Rails will return `nil`. Under the hood this is all handled by the [`ActiveSupport::MessageVerifier`](https://api.rubyonrails.org/v6.0.2.1/classes/ActiveSupport/MessageVerifier.html). As you can see above, you don't need to worry about that, you can treat the `cookies.signed` object as if it were a hash.

Signed cookies are useful for data that can be read by the user, but you need to trust is the same when you get it back to the server again.

### Encrypted cookies

Encrypted cookies take this one step further and encrypt the data in the cookie, then sign it. This is handled by the [`ActiveSupport::MessageEncryptor`](https://api.rubyonrails.org/v6.0.2.1/classes/ActiveSupport/MessageEncryptor.html) and means that without the `secret_key_base` you cannot read or write to this cookie. Thankfully there's no need to worry about the encryption yourself, using the `cookies.encrypted` object you can set encrypted cookies as though they were a regular hash.

Encrypted cookies are useful for private data that you want to store with the user, but you don't want them, or anyone, to read.

## Testing cookies

Suppose we now want to test the controller we saw above. We want to ensure that all of our cookies are set correctly. The test might look something like this:

```ruby
class CookiesControllerTest < ActionDispatch::IntegrationTest
  test "should set cookies when getting the index" do
    get root_url
    assert_response :success
    assert_equal cookies["simple"], "Hello, I am easy to read."
    assert_equal cookies["protected"], "Hello, I can be read, but I can't be tampered with."
    assert_equal cookies["private"], "Hello, I can't be read or tampered with."
  end
end
```

Or with RSpec Rails:

```ruby
RSpec.describe CookiesController, type: :request do
  it "should set cookies when getting the index" do
    get root_url
    expect(response).to have_http_status(:success)
    expect(cookies["simple"]).to eq("Hello, I am easy to read.")
    expect(cookies["protected"]).to eq("Hello, I can be read, but I can't be tampered with.")
    expect(cookies["private"]).to eq("Hello, I can't be read or tampered with.")
  end
end
```

But this would fail at the test for the signed cookie and wouldn't pass for the encrypted cookie either. You can't just call on those cookies straight out of the jar if they have been signed or encrypted.

You might think you should test against the `signed` and `encrypted` version of the cookies, like this:

```ruby
    assert_equal cookies.signed["protected"], "Hello, I can be read, but I can't be tampered with."
    assert_equal cookies.encrypted["private"], "Hello, I can't be read or tampered with."
```

That doesn't work either. At least it doesn't work if you are using the currently recommended way of testing controllers, with `ActionDispatch::IntegrationTest` in Minitest or `type: :request` in RSpec.

If you have the older style `ActionController::TestCase` or `type: :controller` tests, then `cookies.signed` and `cookies.encrypted` will work. If you have an application with the older style tests, do carry on reading just in case you decide to refactor them to come in line with the current Rails way.

With the tests above, the `cookies` object is actually an instance of `Rack::Test::CookieJar`, which does not have knowledge of your Rails application secrets.

## So how do we test these cookies?

This is where I got to with the gem I was working on. I needed to test the result of a signed cookie, but I had a `Rack::Test::CookieJar` object. The good news is we can bring the Rails application's own `ActionDispatch::Cookies::CookieJar` back into play to decode your signed cookies and decrypt your encrypted cookies.

To do so, you instantiate an instance of `ActionDispatch::Cookies::CookieJar` using the `request` object from the test and a hash of your cookie data. You can then call `signed` or `encrypted` on that cookie jar. So now the test looks like:

```ruby
class CookiesControllerTest < ActionDispatch::IntegrationTest
  test "should set cookies when getting the index" do
    get root_url
    assert_response :success
    assert_equal cookies["simple"], "Hello, I am easy to read."
    jar = ActionDispatch::Cookies::CookieJar.build(request, cookies.to_hash)
    assert_equal jar.signed["protected"], "Hello, I can be read, but I can't be tampered with."
    assert_equal jar.encrypted["private"], "Hello, I can't be read or tampered with."
  end
end
```

Or the spec would look like:

```ruby
RSpec.describe CookiesController, type: :request do
  it "gets cookies from the response" do
    get root_url
    expect(response).to have_http_status(:success)
    expect(cookies["simple"]).to eq("Hello, I am easy to read.")
    jar = ActionDispatch::Cookies::CookieJar.build(request, cookies.to_hash)
    expect(jar.signed["protected"]).to eq("Hello, I can be read, but I can't be tampered with.")
    expect(jar.encrypted["private"]).to eq("Hello, I can't be read or tampered with.")
  end
end
```

## Red, Green, Re-snack-tor

In this post we've seen how to test signed or encrypted cookies in Rails. Hopefully your test suite is running green and your cookies are covered now.

I'm going to get back to the refactor I was working on. There are plenty more tests to cover now that these cookies have been polished off.