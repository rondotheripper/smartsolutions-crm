import fs from "fs"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { v4 as uuid } from "uuid"

const SECRET = "secret123"

function readDB() {

  return JSON.parse(
    fs.readFileSync("./lib/db.json", "utf8")
  )

}

function saveDB(data:any) {

  fs.writeFileSync(
    "./lib/db.json",
    JSON.stringify(data, null, 2)
  )

}

export async function register(email:string,password:string){

  if(!email.endsWith("@cmobile.pt")){

    throw new Error("Só emails @cmobile.pt")

  }

  const db = readDB()

  if(db.users.find((u:any)=>u.email===email)){

    throw new Error("Conta já existe")

  }

  const hash = await bcrypt.hash(password,10)

  db.users.push({

    id: uuid(),

    email,

    password: hash

  })

  saveDB(db)

  return jwt.sign({email},SECRET)

}

export async function login(email:string,password:string){

  const db = readDB()

  const user = db.users.find(
    (u:any)=>u.email===email
  )

  if(!user){

    throw new Error("Conta não existe")

  }

  const valid = await bcrypt.compare(
    password,
    user.password
  )

  if(!valid){

    throw new Error("Password errada")

  }

  return jwt.sign({email},SECRET)

}
