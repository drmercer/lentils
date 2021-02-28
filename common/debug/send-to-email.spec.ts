import { mailto } from './send-to-email';

describe('mailto', () => {
  it('should create a basic mailto link correctly', () => {
    expect(mailto({ email: 'test@test.test' })).toEqual('mailto:test@test.test');
  });

  it('should create a link with multiple emails correctly', () => {
    expect(mailto({
      email: ['a@test.test', 'b@test.test'],
    })).toEqual('mailto:a@test.test,b@test.test');
  });

  it('should create a link with multiple kinds of recipients correctly', () => {
    expect(mailto({
      email: ['a@test.test'],
      cc: 'b@test.test',
      bcc: 'c@test.test',
    })).toEqual('mailto:a@test.test?cc=b%40test.test&bcc=c%40test.test');

    expect(mailto({
      email: ['a@test.test'],
      cc: ['b@test.test', 'b2@test.test'],
      bcc: 'c@test.test',
    })).toEqual('mailto:a@test.test?cc=b%40test.test%2Cb2%40test.test&bcc=c%40test.test');

    expect(mailto({
      email: 'a@test.test',
      cc: 'b@test.test',
      bcc: ['c@test.test', 'c2@test.test'],
    })).toEqual('mailto:a@test.test?cc=b%40test.test&bcc=c%40test.test%2Cc2%40test.test');
  });

  it('should create a link with subject and body correctly', () => {
    expect(mailto({
      email: 'a@test.test',
      subject: 'Hello world!',
    })).toEqual('mailto:a@test.test?subject=Hello%20world!');

    expect(mailto({
      email: 'a@test.test',
      body: 'Hello world!',
    })).toEqual('mailto:a@test.test?body=Hello%20world!');
  });

  it('should create a link with multiline body correctly', () => {
    expect(mailto({
      email: 'a@test.test',
      body: `Hello world!
Second line!
Third line!`,
    })).toEqual('mailto:a@test.test?body=Hello%20world!%0ASecond%20line!%0AThird%20line!');
  });

  it('should create a link with subject/body and no email correctly', () => {
    expect(mailto({
      body: `The body`,
    })).toEqual('mailto:?body=The%20body');

    expect(mailto({
      subject: `The subject`,
    })).toEqual('mailto:?subject=The%20subject');

    expect(mailto({
      subject: `The subject`,
      body: `The body`,
    })).toEqual('mailto:?subject=The%20subject&body=The%20body');
  });

  it('should create a link with a body containing emojis correctly', () => {
    expect(mailto({
      body: `Hello 🥯! Hi there, 🥔!`,
    })).toEqual('mailto:?body=Hello%20%F0%9F%A5%AF!%20Hi%20there%2C%20%F0%9F%A5%94!');
  });
});
