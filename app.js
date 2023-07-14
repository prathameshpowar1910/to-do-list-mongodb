//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const _ = require("lodash");
const mongoose = require("mongoose");


mongoose.connect("mongodb+srv://admin-prathamesh:Ci0i6IIxXCG0I8IS@cluster0.tmfgpsw.mongodb.net/todolistDB", {
  useNewUrlParser: true,
});

const itemsSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemsSchema);

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const item1 = new Item({
  name: "Welcome to your todolist",
});
const item2 = new Item({
  name: "Hit + to add a new item",
});
const item3 = new Item({
  name: "<-- Hit this to tick off a item",
});

const defaultItems = [item1, item2, item3];
var count = 0;

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});

const List = mongoose.model("List", listSchema);

app.get("/", async function (req, res) {
  const day = date.getDate();
  const items = await Item.find();

  if (items.length === 0 && count === 0) {
    Item.insertMany(defaultItems);
    count = 1;
    res.redirect("/");
  } else {
    res.render("list", { listTitle: day, newListItems: items });
  }
});

app.post("/", async function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const day = date.getDate();

  const item = new Item({
    name: itemName,
  });

  if (listName == day) {
    item.save();
    res.redirect("/");
  } else {
    const foundList = await List.findOne({ name: listName }).exec();
    foundList.items.push(item);
    foundList.save();
    res.redirect("/" + listName);
  }
});

app.post("/delete", async function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  const day = date.getDate();

  if (listName == day) {
    await Item.findByIdAndRemove(checkedItemId);
    res.redirect("/");
  } else {
    await List.findOneAndUpdate({name: listName},{$pull: {items: {_id: checkedItemId}}} )
    res.redirect("/" + listName);
  }

});

app.get("/:customListName", async function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  const foundList = await List.findOne({ name: customListName }).exec();

  if (!foundList) {
    const list = new List({
      name: customListName,
      items: defaultItems,
    });
    list.save();
    res.redirect("/" + customListName);
  } else {
    res.render("list", {
      listTitle: foundList.name,
      newListItems: foundList.items,
    });
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen( process.env.PORT || 3000, function () {
  console.log("Server started on port 3000");
});
