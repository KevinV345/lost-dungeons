class Pio {
  constructor() {
    this.client = null;
    this.connection = null;
    this.terminado = false;
    this.game_id = "";
    this.message_a_enviar = null;
    this.mensajes = [];
    this.error = "";
    this.esperando_resultado = false;
    this.registration_result = -1;
    this.conection_result = -1;
    this.str_room = "";
    this.r_value = "";
    PlayerIO.useSecureApiRequests = true
    PlayerIO.useSecureConnections = true
  }

  messege_queue_size() {
    return this.mensajes.length;
  }

  get_error() {
    return this.error;
  }

  registrar(name, contra) {
    if (this.esperando_resultado) return;
    this.esperando_resultado = true;
    this.registration_result = -1;

    const authArgs = {
      register: "true",
      username: name,
      password: contra,
    };

    PlayerIO.authenticate(
      this.game_id,
      "public",
      authArgs,
      {},
      (cliente) => {
        this.client = cliente;
        this.registration_result = 1;
        this.esperando_resultado = false;
      },
      (e) => {
        this.error = e.message;
        this.registration_result = 0;
        this.esperando_resultado = false;
      }
    );
  }

  iniciar(name, contra) {
    if (this.esperando_resultado) return;
    this.esperando_resultado = true;
    this.registration_result = -1;

    const authArgs = {
      username: name,
      password: contra,
    };

    PlayerIO.authenticate(
      this.game_id,
      "public",
      authArgs,
      {},
      (cliente) => {
        this.client = cliente;
        this.registration_result = 1;
        this.esperando_resultado = false;
      },
      (e) => {
        this.error = e.message;
        this.registration_result = 0;
        this.esperando_resultado = false;
      }
    );
  }

  get_registration_result() {
    return this.registration_result;
  }

  set_development_server() {
    this.client.multiplayer.developmentServer = "127.0.0.1:8184";
  }

  async load_rooms() {
    return new Promise((resolve) => {
      this.str_room = "";
      this.client.multiplayer.listRooms(
        "game",
        null,
        0,
        0,
        (infoRooms) => {
          for (const info of infoRooms) {
            this.str_room += `${info.id}:${info.onlineUsers} `;
          }
          resolve(this.str_room.trim());
        },
        (e) => {
          this.error = e.message;
          resolve("");
        }
      );
    });
  }

  desconectar() {
    if (this.connection) this.connection.disconnect();
  }

  set_game_id(id) {
    this.game_id = id;
  }

  is_conected() {
    return this.connection && this.connection.connected;
  }

  conectar(tipo_room, mapa, roomid) {
    if (this.conection_result === -2) return false;
    if (this.conection_result === 0) {
      this.conection_result = -1;
      return false;
    }
    if (this.conection_result === 1) {
      this.conection_result = -1;
      return true;
    }
    this.conection_result = -2;

    const roomdata = { mapa };

    this.client.multiplayer.createJoinRoom(
      roomid,
      tipo_room,
      true,
      roomdata,
      {},
      (c) => {
        this.connection = c;
        this.connection.addMessageCallback("*", (msg) => {
          this.mensajes.push(msg);
        });
        this.conection_result = 1;
      },
      (e) => {
        this.error = e.message;
        this.conection_result = 0;
      }
    );

    return false;
  }

  hay_mensaje() {
    return this.mensajes.length > 0;
  }

  borrar_mensaje() {
    if (this.mensajes.length > 0) this.mensajes.shift();
  }

  mensaje_get_tipo() {
    return this.mensajes[0]?.type || "";
  }

  get_id() {
    return this.client?.connectUserId || "";
  }

  mensaje_get_string(index) {
    return this.mensajes[0]?.getString(index) || "";
  }

  mensaje_get_float(index) {
    const msg = this.mensajes[0];
    if (!msg) return 0;
    try {
      return msg.getFloat(index);
    } catch {
      try {
        return msg.getInt(index);
      } catch {
        return 0;
      }
    }
  }

  mensaje_get_int(index) {
    const msg = this.mensajes[0];
    if (!msg) return 0;
    try {
      return msg.getInt(index);
    } catch {
      try {
        return msg.getFloat(index);
      } catch {
        return 0;
      }
    }
  }

  mensaje_get_bool(index) {
    return this.mensajes[0]?.getBoolean(index) || false;
  }

  mensaje_enviar() {
    // console.log(this.message_a_enviar.toString());
    this.connection?.sendMessage(this.message_a_enviar);
  }

  mensaje_create(tipo) {
    if (!this.connection) {
      this.error = "No hay conexión";
      return;
    }
    if (typeof tipo !== "string") {
      tipo = String(tipo); // forza cualquier tipo a string primitivo
    }
    this.message_a_enviar = this.connection.createMessage(tipo);
  }

  mensaje_add_string(value) {
    if (typeof value !== "string") {
      value = String(value); // forza cualquier tipo a string primitivo
    }


    // ⚠️ Asegura que no sea un objeto ni array convertido
    if (value.includes("[object")) {
      console.error("Valor inválido para string en mensaje:", value);
      return;
    }

    try {
      this.message_a_enviar?.add(value);
    } catch (e) {
      console.error("Fallo al agregar string:", value, typeof value, e);
    }
  }



  mensaje_add_int(value) {
    if (typeof value != "number" || !Number.isInteger(value)) {
      console.error("mensaje_add_int: tipo inválido:", typeof value, value);
      return;
    }
    this.message_a_enviar?.add(value);
  }

  mensaje_add_float(value) {
    if (typeof value != "number") {
      console.error("mensaje_add_float: tipo inválido:", typeof value, value);
      return;
    }
    this.message_a_enviar?.add(value);
  }

  mensaje_add_bool(value) {
    if (typeof value != "boolean") {
      console.error("mensaje_add_bool: tipo inválido:", typeof value, value);
      return;
    }
    this.message_a_enviar?.add(value);
  }

  r_value = null;
  esperando_get_value = false;

  get_value(index) {
    if (this.esperando_get_value) {
      const r = this.r_value;
      if (r !== null) {
        this.r_value = null;
        this.esperando_get_value = false;
      }
      return r;
    }

    this.esperando_get_value = true;
    this.r_value = null;

    this.client.bigDB.loadMyPlayerObject(
      (obj) => {
        this.r_value = obj[index] ?? "";
      },
      (e) => {
        this.error = e.message;
        this.r_value = "";
      }
    );

    return this.r_value;
  }

  async set_value(key, value) {
    return new Promise((resolve) => {
      this.client.bigDB.loadMyPlayerObject(
        (obj) => {
          obj.set(key, value);
          obj.save(
            () => resolve(),
            (e) => {
              this.error = e.message;
              resolve();
            }
          );
        },
        (e) => {
          this.error = e.message;
          resolve();
        }
      );
    });
  }
}

// Registrar como singleton global para Godot
window.pio = new Pio();
