const express = require("express");
const app = express();
let mongoose = require("mongoose");
let { productosRouter } = require("./routes/productos.js");
let { Productos } = require("./models/productos.js");
let { CRUDproductos } = require("./db/productos.js");
let cookieParser = require("cookie-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo");

const http = require("http").Server(app);
const PORT = 8080;

http.listen(PORT, () => {
  console.log(`Servidor HTTP escuchando en el puerto ${PORT}`);
});

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("./public"));
const io = require("socket.io")(http);

app.use("/productos", productosRouter);

app.use(
  session({
    store: MongoStore.create({
      mongoUrl:
        "mongodb+srv://gonzalogil:gonzalogil@cluster0.lvfuy.mongodb.net/cookies?retryWrites=true&w=majority",
      mongoOptions: { useNewUrlParser: true, useUnifiedTopology: true },
      ttl: 600,
    }),
    secret: "123456",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      maxAge: 600000,
    },
  })
);

app.post("/login", (req, res) => {
  const { nombre } = req.body;
  req.session.nombre = nombre;
  if (req.session.nombre) {
    res.send(`Bienvenid@ ${nombre}`);
    res.redirect("/");
  }
  // res.cookie("nombre", nombre, { maxAge: 60000 }).send(
  //   `<span>Bienvenido ${nombre}</span>
  //   <form method="get" action="/logout">
  //   <button type="submit" class="btn btn-primary" id="logoutButton">Salir</button>
  //   </form>
  //    `
  // );
});

app.get("/logout", (req, res) => {
  let nombre = req.session.nombre ? req.session.nombre : "";
  if (nombre) {
    req.session.destroy((err) => {
      if (!err) res.send(`Logout ${nombre}`);
      else res.redirect("/");
    });
  } else {
    res.redirect("/");
  }
  // const { nombre } = req.cookies;
  // res.clearCookie("nombre");
  // setTimeout(() => {
  //   res.redirect("/");
  // }, 2000);
  // res.send(`Hasta luego ${nombre}`);
});

const mensajes = [];

ConectandoaBD();

async function ConectandoaBD() {
  try {
    const URI = "mongodb://localhost:27017/ecommerce";
    await mongoose.connect(URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await Productos.deleteMany({});
    await Productos.insertMany(this.products, (error) => {
      if (error) {
        throw ` Error al grabar productos ${error}`;
      } else {
        console.log(`Productos grabados...`);
      }
    });
  } catch (error) {
    throw new Error(error.message);
  }
}
let { getChat, nuevoMensaje } = require("./controller/mensajes.js");

let db = new CRUDproductos();

io.on("connection", async (socket) => {
  console.log("conectado!");
  socket.on("broadcast", db.products);
  socket.on("nuevo", async (data) => {
    mensajes.push(data);
    io.sockets.emit("mensajes", mensajes);
    let mensaje = await nuevoMensaje(data);
    io.socket.emit("nuevo-mensaje", mensaje);
  });
  getData();
});

async function getData() {
  try {
    let chat = await getChat();
    socket.emit("data", chat);
  } catch (e) {
    throw new Error(e);
  }
}
