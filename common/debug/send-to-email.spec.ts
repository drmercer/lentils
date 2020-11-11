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
    })).toEqual('mailto:a@test.test?subject=Hello+world%21');

    expect(mailto({
      email: 'a@test.test',
      body: 'Hello world!',
    })).toEqual('mailto:a@test.test?body=Hello+world%21');
  });

  it('should create a link with multiline body correctly', () => {
    expect(mailto({
      email: 'a@test.test',
      body: `Hello world!
Second line!
Third line!`,
    })).toEqual('mailto:a@test.test?body=Hello+world%21%0ASecond+line%21%0AThird+line%21');
  });

  it('should create a link with subject/body and no email correctly', () => {
    expect(mailto({
      body: `The body`,
    })).toEqual('mailto:?body=The+body');

    expect(mailto({
      subject: `The subject`,
    })).toEqual('mailto:?subject=The+subject');

    expect(mailto({
      subject: `The subject`,
      body: `The body`,
    })).toEqual('mailto:?subject=The+subject&body=The+body');
  });

  it('should create a link with a body containing emojis correctly', () => {
    expect(mailto({
      body: `Hello 🥯! Hi there, 🥔!`,
    })).toEqual('mailto:?body=Hello+%F0%9F%A5%AF%21+Hi+there%2C+%F0%9F%A5%94%21');
  });
});
