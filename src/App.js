import React from "react";

import Search from "./views/Search";
import Display from "./views/Display";
import Top from "./views/Top";

import ModalHow from "./components/ModalHow";
import ModalWin from "./components/ModalWin";
import Popup from "./components/Popup";

import "./App.css";
import data from "./assets/data.json";
import catagoryNames from "./assets/catagoryNames.json";

class App extends React.Component {
  constructor(props) {
    super(props);

    this.doSearch = this.doSearch.bind(this);
    this.updateDisplay = this.updateDisplay.bind(this);
    this.seedValues = this.seedValues.bind(this);
    this.doRandom = this.doRandom.bind(this);
    this.toggleModal = this.toggleModal.bind(this);
    this.togglePopup = this.togglePopup.bind(this);
    this.updateStorageStats = this.updateStorageStats.bind(this);

    this.state = {
      catagories: {}, // {<catagoryname>: {high: <0>, highName: <"">, low: <0> lowName: <""> target: <0>, lineThing: <0,1,2>}, ...}
      history: [], //{<country>, <country>, ...}
      modalType: 1, //0: "none", 1: "how" 2: "win from top" 3: "win"
      popupType: 0, //0: "none", 1: "Already Guessed", 2: "Invalid Country", 3: "Copied to Clipboard"
      win: false,
    };
  }

  componentDidMount() {
    this.seedValues();
  }

  updateStorageStats(score) {
    let stats = JSON.parse(localStorage.getItem("stats"));
    let best = stats.best;
    let average = stats.average;
    let rounds = stats.rounds;

    // update best
    if (score < best || best === 0) {
      best = score;
    }

    // update average
    average = Math.round(((average * rounds + score) / (rounds + 1)) * 10) / 10;
    rounds = rounds + 1;

    stats = {
      rounds: rounds,
      best: best,
      average: average,
    };

    localStorage.setItem("stats", JSON.stringify(stats));
  }

  /* pick target country and catagories */
  seedValues() {
    if (!localStorage.getItem("stats")) {
      //set up stats
      const stats = {
        rounds: 0,
        best: 0,
        average: 0,
      };

      localStorage.setItem("stats", JSON.stringify(stats));
    }

    const countryRandIndex = Math.floor(Math.random() * data.length); //country randomizer
    const targetCountry = data[countryRandIndex];
    console.log(targetCountry);
    const catagoriesList = Object.keys(catagoryNames);
    // Select which 4 catagories
    const seeds = this.doRandom(4, catagoriesList.length);

    // Generate inital state values
    const initialState = {};
    for (let i in seeds) {
      var key = catagoriesList[seeds[i]];
      initialState[key] = {
        target: targetCountry[key],
        high: "",
        highName: "\u00A0",
        low: "",
        lowName: "\u00A0",
        lineThing: 0,
      };
    }

    //set initial state
    this.setState({
      catagories: initialState,
      win: false,
    });
  }

  updateDisplay(countryData) {
    // update state, update display
    const check = Object.entries(this.state.catagories)[0];
    const newCatagories = {}; //we fill this instead of repeatedly calling state
    const newHistory = this.state.history; //history stores what gets inputed
    newHistory.push(countryData.name);

    // check if target country
    if (countryData[check[0]] === check[1].target) {
      this.updateStorageStats(newHistory.length);
      for (let i in Object.keys(this.state.catagories)) {
        var keyWin = Object.keys(this.state.catagories)[i];
        const catagory = this.state.catagories[keyWin];
        newCatagories[keyWin] = {
          target: catagory.target,
          high: catagory.target,
          highName: countryData.name,
          low: catagory.target,
          lowName: countryData.name,
          lineThing: 0,
        };

        this.setState({
          catagories: newCatagories,
          history: newHistory,
          win: true,
        });
      }
      this.toggleModal(3); //win condtion
      return;
    }

    //loop through data catagories; name, pop, area,
    for (let i in Object.keys(this.state.catagories)) {
      var key = Object.keys(this.state.catagories)[i];

      const catagory = this.state.catagories[key];
      const rank = parseInt(countryData[key]);
      const target = parseInt(catagory.target);

      newCatagories[key] = {
        target: catagory.target,
        high: "",
        highName: "",
        low: "",
        lowName: "",
        lineThing: 0,
      }; //adding new blank row

      if (rank < target) {
        //1: higher rank
        if (catagory.high === "" || rank > catagory.high) {
          newCatagories[key].high = rank;
          newCatagories[key].highName = countryData.name;
        } else {
          newCatagories[key].high = catagory.high;
          newCatagories[key].highName = catagory.highName;
          newCatagories[key].lineThing = 1;
        }
        newCatagories[key].low = catagory.low;
        newCatagories[key].lowName = catagory.lowName;
      } else if (rank > target) {
        //2: lower rank

        if (catagory.low === "" || rank < catagory.low) {
          newCatagories[key].low = rank;
          newCatagories[key].lowName = countryData.name;

        } else {
          newCatagories[key].low = catagory.low;
          newCatagories[key].lowName = catagory.lowName;
          newCatagories[key].lineThing = 2;
        }
        newCatagories[key].high = catagory.high;
        newCatagories[key].highName = catagory.highName;
      }
    }

    // Update State
    this.setState({
      catagories: newCatagories,
      history: newHistory,
    });
  }

  togglePopup(type = 0) {
    this.setState({
      popupType: type,
    });
  }

  doSearch(inp) {
    let searchTerm = inp.toLowerCase();
    for (let i in this.state.history) {
      if (searchTerm === this.state.history[i].toLowerCase()) {
        this.togglePopup(1);
        return;
      }
    }

    for (let i in data) {
      if (searchTerm === data[i].name.toLowerCase()) {
        this.updateDisplay(data[i]);
        return;
      }
    }
    this.togglePopup(2);
  }

  /* changes modal display
  input: 0: "none", 1: "how" 2: "settings" 3: "win"
  */
  toggleModal(type = 0) {
    this.setState({
      modalType: type,
    });
  }

  /* generate ordered random values
  number: amount of returns
  range: total 0-N
  seed: seed for randomness
  */
  doRandom(number, range) {
    var retArr = [];
    for (let i = 0; i < range; i++) {
      retArr.push(i);
    }

    // remove from this new list
    while (retArr.length > number) {
      retArr.splice(Math.floor(Math.random() * retArr.length), 1);
    }

    return retArr;
  }

  render() {
    let modalDisplay = null;
    switch (this.state.modalType) {
      case 0:
        break;
      case 1:
        modalDisplay = <ModalHow toggleModal={this.toggleModal} />;
        break;
      case 2:
        modalDisplay = (
          <ModalWin
            toggleModal={this.toggleModal}
            togglePopup={this.togglePopup}
            history={this.state.history}
            catagories={this.state.catagories}
            special={false}
            win={this.state.win}
          />
        );
        break;
      case 3:
        modalDisplay = (
          <ModalWin
            toggleModal={this.toggleModal}
            togglePopup={this.togglePopup}
            history={this.state.history}
            catagories={this.state.catagories}
            special={true}
            win={this.state.win}
          />
        );
        break;
      default:
        break;
    }
    let popupDisplay = null;
    switch (this.state.popupType) {
      case 0:
        break;
      case 1:
        popupDisplay = (
          <Popup display={"Duplicate Country"} togglePopup={this.togglePopup} />
        );
        break;
      case 2:
        popupDisplay = (
          <Popup display={"Invalid Country"} togglePopup={this.togglePopup} />
        );
        break;
      case 3:
        popupDisplay = (
          <Popup
            display={"Copied to Clipboard"}
            togglePopup={this.togglePopup}
          />
        );
        break;
      default:
        break;
    }

    return (
      <>
        {popupDisplay}
        {modalDisplay}
        <Top
          guessCount={this.state.history.length}
          toggleModal={this.toggleModal}
        />
        <Display
          values={this.state.catagories}
          currentCountry={this.state.history[this.state.history.length - 1]}
        />
        <Search doSearch={this.doSearch} win={this.state.win} />
      </>
    );
  }
}

export default App;
