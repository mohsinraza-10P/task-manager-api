const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/user");
const { userOne, setupDatabase } = require("./fixtures/db");

// Executes before each test case
beforeEach(setupDatabase);

test("Should sign-up a new user", async () => {
  const response = await request(app)
    .post("/users")
    .send({
      name: "Mohsin",
      email: "mohsin@yopmail.com",
      password: "12345678",
    })
    .expect(201);

  // Assert database
  const dbUser = await User.findById(response.body.user._id);
  expect(dbUser).not.toBeNull();

  // Assert response body
  expect(response.body).toMatchObject({
    user: {
      name: "Mohsin",
      email: "mohsin@yopmail.com",
    },
    token: dbUser.tokens[0].token,
  });

  // Assert plain text password isn't stored in database
  expect(dbUser.password).not.toBe("12345678");
});

test("Should login a existing user", async () => {
  const response = await request(app)
    .post("/users/login")
    .send({
      email: userOne.email,
      password: userOne.password,
    })
    .expect(200);

  // Validate new token is saved
  const dbUser = await User.findById(userOne._id);
  expect(response.body.token).toBe(dbUser.tokens[1].token);
});

test("Should not login unknown user", async () => {
  await request(app)
    .post("/users/login")
    .send({
      email: userOne.email,
      password: "incorrect",
    })
    .expect(500);
});

test("Should fetch profile for user", async () => {
  await request(app)
    .get("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
});

test("Should not fetch profile for unauthorized user", async () => {
  await request(app).get("/users/me").send().expect(401);
});

test("Should delete account for user", async () => {
  await request(app)
    .delete("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  // Validate user is removed
  const dbUser = await User.findById(userOne._id);
  expect(dbUser).toBeNull();
});

test("Should not delete account for unauthorized user", async () => {
  await request(app).delete("/users/me").send().expect(401);
});

test("Should upload avatar image for user", async () => {
  await request(app)
    .post("/users/me/avatar")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .attach("avatar", "tests/fixtures/profile-pic.png")
    .expect(200);

  // Validate user avatar
  const dbUser = await User.findById(userOne._id);
  expect(dbUser.avatar).toEqual(expect.any(Buffer));
});

test("Should update valid user fields", async () => {
  await request(app)
    .patch("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({ name: "Ronaldo" })
    .expect(200);

  // Validate data updated correctly
  const dbUser = await User.findById(userOne._id);
  expect(dbUser.name).toBe("Ronaldo");
});

test("Should not update invalid user fields", async () => {
  await request(app)
    .patch("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({ weight: 85 })
    .expect(400);
});

// User Test Ideas
//
// Should not signup user with invalid name/email/password
// Should not update user if unauthenticated
// Should not update user with invalid name/email/password