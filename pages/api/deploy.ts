import { exec } from "child_process";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      await runWebhook();
      return res.status(200).json({ message: "Success" });
    } catch (error) {
      console.error("Error executing webhook:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  } else {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
}

const runWebhook = async () => {
  return new Promise((resolve, reject) => {
    exec(
      'sudo sh /var/www/deploy.sh',
      { cwd: '/var/www/html' },
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing shell script: ${error}`);
          reject('Internal Server Error');
        } else {
          console.log(`Shell script output: ${stdout}`);
          resolve('Shell script executed successfully');
        }
      }
    );
  });
};