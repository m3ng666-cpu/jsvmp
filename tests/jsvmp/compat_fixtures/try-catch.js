function safeParse(input) {
  try {
    return JSON.parse(input).name;
  } catch (error) {
    return 'fallback';
  } finally {
    console.log('done');
  }
}

console.log(safeParse('{"name":"jsvmp"}'));
console.log(safeParse('oops'));
