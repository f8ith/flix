import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
rl.pause();

function ask(question: string, cb = (...args: any) => void 0): Promise<string> {
  return new Promise(resolve => {
    rl.question(question, (...args) => {
      rl.pause();
      resolve(...args);
      cb(...args);
    });
  });
}

export default ask;
