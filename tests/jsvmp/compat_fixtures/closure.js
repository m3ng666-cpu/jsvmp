function createCounter(start) {
  let count = start;
  return function next() {
    count += 1;
    return count;
  };
}

const counter = createCounter(2);
console.log(counter());
console.log(counter());
