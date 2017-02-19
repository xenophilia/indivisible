$(document).ready(function () {

  document.xenophilia = document.xenophilia || {};
  document.xenophilia.indivisible = document.xenophilia.indivisible || {};
  document.xenophilia.indivisible.code = {};

  //___________________________________________________________________________
  // Local variables used to control re-rendering.

  // Get accessor for querying content after '?' in the URL.
  var urlParams   = new URLSearchParams(window.location.search);

  var timestamp   = new Date();     ///< Used by copyright.
  var debug       = (urlParams.get('debug') == 'true');
  var stable      = null;
  var hover       = null;
  var cover       = {};             ///< Used by waypoints to support coverage.
  var entity      = {};             ///< Storage for custom entities.

  //___________________________________________________________________________
  // search contains all search patterns used to re-render markDOWN as markUP.
  var search = {
    define  : {pattern: /\{([A-Za-z][0-9A-Za-z]*)=([^]+?)\}/gim },
    verbatim: {pattern: /!V([^]+?)V!/gim},
    entities: {pattern: /(&amp;([A-Za-z][0-9A-Za-z]*);)/gim},
    commentN: {pattern: /(!#[^]*#!)/gim,
               replace: ''},
    comment1: {pattern: /(!##[^]*$)/gim,
               replace: ''},
    URL :     {pattern: /!url\s*([^]+?)\s*@\s*([^]+?)\s*url!/gim,
               replace: '<a href="$2">$1</a>'
    },
    heads   : {
        index: [6, 5, 4, 3, 2, 1],  ///< inverse order of indices required.
        1: {pattern: /^\s*=\s*(.+)\s*=\s*$/gim,
            replace: 
                '<div align="center">' +
                '<big>'.repeat(6) + '$1' + '</big>'.repeat(6) +
                '</div>'
        },
        2: {pattern: /^\s*==\s*(.+)\s*==\s*$/gim,
            replace: 
                '<div align="center">' +
                '<big>'.repeat(5) + '$1' + '</big>'.repeat(5) +
                '</div>'
        },
        3: {pattern: /^\s*===\s*(.+)\s*===\s*$/gim,
            replace: 
                '<div align="center">' +
                '<big>'.repeat(4) + '$1' + '</big>'.repeat(4) +
                '</div>'
        },
        4: {pattern: /^\s*====\s*(.+)\s*====\s*$/gim,
            replace: 
                '<div align="center">' +
                '<big>'.repeat(3) + '$1' + '</big>'.repeat(3) +
                '</div>'
        },
        5: {pattern: /^\s*=====\s*(.+)\s*=====\s*$/gim,
            replace: 
                '<div align="center">' +
                '<big>'.repeat(2) + '$1' + '</big>'.repeat(2) +
                '</div>'
        },
        6: {pattern: /^\s*======\s*(.+)\s*======\s*$/gim,
            replace: 
                '<div align="center">' +
                '<big>'.repeat(1) + '$1' + '</big>'.repeat(1) +
                '</div>'
        }
    },
    enhance : {
        bold:       {pattern: /!bold(.*)bold!/g,
                     replace: '<b>$1</b>'   },
        b:          {pattern: /!=(.*)=!/g,
                     replace: '<b>$1</b>'   },
        italic:     {pattern: /!italic(.*)italic!/g,
                     replace: '<i>$1</i>'   },
        i:          {pattern: /!\/(.*)\/!/g,
                     replace: '<i>$1</i>'   },
        strike:     {pattern: /!strike(.*)strike!/g,
                     replace: '<s>$1</s>'   },
        s:          {pattern: /!-(.*)-!/g,
                     replace: '<s>$1</s>'   },
        underscore: {pattern: /!underscore(.*)underscore_!/g,
                     replace: '<u>$1</u>'   },
        u:          {pattern: /!_(.*)_!/g,
                     replace: '<u>$1</u>'   }
        },
    space   : {
      index : "hr2,hr1,p,nl1,nl2,br".split(','),
      hr2   : {pattern: /_{4,}/g,
               replace: '<hr /><hr />'              },
      hr1   : {pattern: /_{3,}/g,
               replace: '<hr />'                    },
      p:      {pattern: /\^\^\^\^/g,
               replace: '<p />'                     },
      nl1   : {pattern: /\n\s*\.\.\.+/gim,
               replace: "<p />&nbsp;&nbsp;&nbsp;"   },
      nl2   : {pattern: /\n\s*[\n\s*]*\n/gim,
               replace: "<p />"                     },
      br    : {pattern: /\^\^\^/g,
               replace: '<br />'                    }
    },
    align   : {
      center: {pattern: /!C([^]+?)C!/gim,
               replace: '<div align="center">$1</div>'  },
      left  : {pattern: /!L([^]+?)L!/gim,
               replace: '<div align="left">$1</div>'    },
      right : {pattern: /!R([^]+?)R!/gim,
               replace: '<div align="right">$1</div>'   }
    },
    bullets: {
        index: [6, 5, 4, 3, 2, 1],  ///< inverse order of indices required.
        1: {pattern: /^\s*\*(\S*)\s*/gim,
            replace: function(match, p1, off, str) {
                console.log(p1);
                return '<br /><div class="bullet1">' +
                    '&nbsp;&nbsp;'.repeat(1) +
                    (p1 ?  p1 : '&#8226;') + '</div> ';
            }},
        2: {pattern: /^\s*\*\*(\S*)\s*/gim,
            replace: function(match, p1, off, str) {
                console.log(p1);
                return '<br /><div class="bullet2">' +
                    '&nbsp;&nbsp;'.repeat(2) +
                    (p1 ?  p1 : '&spades;') + '</div> ';
            }},
        3: {pattern: /^\s*\*\*\*(\S*)\s*/gim,
            replace: function(match, p1, off, str) {
                console.log(p1);
                return '<br /><div class="bullet3">' +
                    '&nbsp;&nbsp;'.repeat(3) +
                    (p1 ?  p1 : '&hearts;') + '</div> ';
            }},
        4: {pattern: /^\s*\*\*\*\*(\S*)\s*/gim,
            replace: function(match, p1, off, str) {
                console.log(p1);
                return '<br /><div class="bullet4">' +
                    '&nbsp;&nbsp;'.repeat(4) +
                    (p1 ?  p1 : '&diams;') + '</div> ';
            }},
        5: {pattern: /^\s*\*\*\*\*\*(\S*)\s*/gim,
            replace: function(match, p1, off, str) {
                console.log(p1);
                return '<br /><div class="bullet5">' +
                    '&nbsp;&nbsp;'.repeat(5) +
                    (p1 ?  p1 : '&clubs;') + '</div> ';
            }},
        6: {pattern: /^\s*\*\*\*\*\*\*(\S*)\s*/gim,
            replace: function(match, p1, off, str) {
                console.log(p1);
                return '<br /><div class="bullet6">' +
                    '&nbsp;&nbsp;'.repeat(6) +
                    (p1 ?  p1 : '&dagger;') + '</div> ';
            }},
    },
    check  : {
      pattern: /^\s*!@(.)(.)\s*([^]*?)@!\s*$/gim,
      box  : {
        ' ': '<b>&#x2610;</b>',
        'x': '<b style="color:red">&#x2718;</b>',
        'v': '<b style="color:green">&#x2713;</b>'
      },
      num  : {
        ' ': '&nbsp;',
        '0': '0', // '&#9450;',
        '1': '1', // '&#9312;',
        '2': '2', // '&#9313;',
        '3': '3', // '&#9314;',
        '4': '4', // '&#9315;',
        '5': '5', // '&#9316;',
        '6': '6', // '&#9317;',
        '7': '7', // '&#9318;',
        '8': '8', // '&#9319;',
        '9': '9', // '&#9320;'
      }
    },
    plot   : {
      XYT: {pattern: /!XYT\s+([^]+)\s+XYT!/,  replace: '$1'},
      XYZT: {pattern: /!XYZT\s+([^]+)\s+XYZT!/,  replace: '$1'},
      XY: {pattern: /!XY\s+([^]+)\s+XY!/,     replace: '$1'},
      XYZ: {pattern: /!XYZ\s+([^]+)\s+XYZ!/,     replace: '$1'},
    }
  };







  function transformNumbers(text){
    // Solution provided by:
    // https://stackoverflow.com/users/6647153/ibrahim-mahrir
    // Maximum depth (maximum number of Ns in N.N.N.N... that we could have)
    var MAXDEPTH = 10;
  
    // Holds the value of the ith number N in N.N.N....
    var sections = new Array(MAXDEPTH);
  
    // Initialise all to 0.  1st substitution becomes 1.1.1.1.1... (0 + 1)
    sections.fill(0, 0, MAXDEPTH - 1);
  
    // Check for:
    //    A) A valid sustitution (\s*#+.*).
    //    B) Not valid substitution (\s* [^#\n]+) so we can
    // initialize our sections array when we don't have a substitution.
    return text.replace(
            /(^\s*(#+)(.*)$)|(^\s*[^#\n]+$)/mg,
            function(match, substitution, sharps, after) {
        // if line is invalid substitution reinitialize sections with zeros
        if(!substitution){
          // reinitialize sections
          sections.fill(0, 0, MAXDEPTH - 1);
          // return match so nothing is replaced
          return match;
        }
      
        // length - 1 represent the depth of this substitution
        var length = sharps.length;
        // reinitialize all substitutions after this depth to zero so
        // when we go from 1.2. to 1.3.
        // all sections N after 3. (1.3.N.N.N.N...) will be initialized to 0
        sections.fill(0, length, MAXDEPTH - 1);
      
        // increment section of this depth
        // (if length is 2 ans sections is 1.2. then it will become 1.3)
        sections[length - 1]++;
      
        // replacement for the ####... string
        var replacement = "";
        for(var i = 0; i < length; i++)
          // each # will be replaced by its equivalent section
          // according to which depth (i) it's on
          replacement += sections[i] + ".";
      
        // ignore the leading spaces, replace 'sharps' with 'replacement' and
        // insert whatever was after 'sharps'
        return '<b><i>' + replacement + '</i></b>&nbsp;' + after + '<br />';
    })
  }

  var transformNumbers_test = function() {
    var text = "" +
        "# n11\n## n21\n### n31\n### n32\n## n22\n# n12\n## n23\n" +
        "hello" +
        "\n# n31\n## n24\n# n41";
    console.log("BEFORE:\n", text);
    console.log("AFTER:\n", transformNumbers(text));
  }

  //transformNumbers_test();






  //___________________________________________________________________________
  var waypoint = function(key, sub) {
    if (!key) {
      console.log(cover);
      Array.prototype.forEach.call(cover, function(key) {
        Array.prototype.forEach.call(cover[key], function(sub) {
          var count = cover[key][sub];
          if (count == 0) console.log("no coverage[" + key + "][" + sub + "]");
        });
      });
    } else {
      if (!Object.hasOwnProperty.call(cover, key)) cover[key] = {};
      if (!Object.hasOwnProperty.call(cover[key], sub)) cover[key][sub] = 0;
      cover[key][sub]++;
    }
  };

  //___________________________________________________________________________
  // Simple handling of waypoint data over all aspects of rendering.
  var follow = function(key, fun) {
    waypoint('cover', key);
    fun(key);
  }

  //___________________________________________________________________________
  // Fetch execution time to update the copyright above the nav.
  if (!Date.now) {
    Date.now = function now() {
      return timestamp.getTime();
    };
  }

  //___________________________________________________________________________
  // Unused but extremely powerful mechanism for implementing multiline text.
  function HEREDOC(f) {
    return f.toString().split('\n').slice(1,-1).join('\n').normalize('NFC');
  }

  //___________________________________________________________________________
  // Find and ingest "&{name}={replacement text};" definitions from CDATA.
  follow("define", function(name) {
    var my = search[name];
    var element = document.getElementById(name);
    // No replacement happens.  The replace function pattern is useful.
    if (typeof element !== "undefined" && element != null) {
      element.innerHTML.replace(
        my.pattern,
        function(match, p1, p2, off, str) {
          waypoint(name, name);
          entity[p1] = p2;
          return '';
        });
    }
  });

  //___________________________________________________________________________
  // markup is the central function for re-rendering markdown as markup.
  //___________________________________________________________________________
  var markup = function(section) {

    if (typeof section === "undefined" || section === null)
      return 'No sections.';
    var source = section.innerHTML;  ///< Original markDOWN from a section.
    var target = source;             ///< Intended markUP to fill a section.

    // Potential logging and waypoint too.
    var verbose = function(msg) {
      console.log(msg);
    };

    //_________________________________________________________________________
    // Find and eliminate multi-line comment data
    follow("commentN", function(name) {
      var my = search[name];
      target = target.replace(my.pattern, my.replace);
    });

    //_________________________________________________________________________
    // Find and eliminate single-line comment data
    follow("comment1", function(name) {
      var my = search[name];
      target = target.replace(my.pattern, my.replace);
    });

    //_________________________________________________________________________
    // Verbatim guaranteed by conversion to explicit numeric codepoints.
    follow("verbatim", function(name) {
      var my = search[name];
      target = target.replace(my.pattern,
        function(match, p1, off, str) {
          waypoint(name, name);
          var result = "";
          var N = p1.length;
          for (i=0; i<N; ++i) {
            var chr = p1[i];
            var ord = p1.charCodeAt(i);
            if (ord == 0x0a) result += chr;
            else result += "&#" + ord.toString() + ";";
          }
          return '<pre>' + result + '</pre>';
        });
    });

    //_________________________________________________________________________
    // Replace custome entities produced by the "defined" stage.
    follow("entities", function(name) {
      var my = search[name];
      target = target.replace(my.pattern,
        function(match, p1, p2, off, str) {
          waypoint(name,p2);
          if (Object.hasOwnProperty.call(entity, p2)) return entity[p2];
          else return p1;
        });
    });

    //_________________________________________________________________________
    // URL expression
    follow("URL", function(name) {
      var the = search[name];
      target = target.replace(the.pattern, the.replace);
    });

    //_________________________________________________________________________
    // H1, H2, H3, H4, H5, H6
    follow("heads", function(name) {
      var my = search[name];
      var head = function(the) {
        target = target.replace(the.pattern, the.replace);
      };
      Array.prototype.forEach.call(my.index, function(i) { head(my[i]); });
    });

    //_________________________________________________________________________
    // Bold, Italic, Underscore, Strike
    follow("enhance", function(name) {
      var my = search[name];
      var enhance = function(the) {
        target = target.replace(the.pattern, the.replace);
      };
      for (var index in my) enhance(my[index]);
    });

    //_________________________________________________________________________
    // Horizontal rule, line, and paragraph breaks
    // TODO insert waypoint.
    // TODO use function rather than .replace
    follow("space", function(name) {
      var my = search[name];
      for (var index in my.index) {
        var the = my[my.index[index]];
        target = target.replace(the.pattern, the.replace);
      }
    });

    //_________________________________________________________________________
    // Right/Center/Left alignment
    follow("align", function(name) {
      var my = search[name];
      var alignK = function(key) {
        var the = my[key];
        target = target.replace(the.pattern, the.replace);
      };
      for (align in my) alignK(align);
    });

    //_________________________________________________________________________
    // Plots
    follow("plot", function(name) {
      var my = search[name];
      var plotK = function(key) {
        var the = my[key];
        target = target.replace(the.pattern, the.replace);
      };
      for (plot in my) plotK(plot);
    });

    //_________________________________________________________________________
    // Bullet lists
    follow("bullets", function(name) {
      var my = search[name];
      var bulletL = function(the) {
        target = target.replace(the.pattern, the.replace);
      };
      for (var index in my.index) bulletL(my[my.index[index]]);
    });

    //_________________________________________________________________________
    // Bullet lists
    follow("bullets", function(name) {
      var my = search[name];
      target = transformNumbers(target);  // TODO integrate style
    });

    //_________________________________________________________________________
    // Number lists (TODO)
    follow("number", function(name) {
      var numbering = [0, 0, 0, 0, 0];
      var numberL = function(level) {
        lines = target.split('\n');
        for (line in lines) {
        }
      };
    });

    //_________________________________________________________________________
    // Punch lists
    follow("check", function(name) {
      var my = search[name];
      target = target.replace(my.pattern,
        function(match, p1, p2, p3, off, str) {
          var chr1 = my.box[p1] || p1;
          var chr2 = my.num[p2] || p2;
          return '' +
            '<div class="check">' +
              '<div class="check-box">'      + chr1 + '</div>' +
              '<div class="check-priority">' + chr2 + '</div>' +
              '<div class="check-text">'     + p3   + '</div>' +
            '</div>';
        });
    });

    //_________________________________________________________________________
    // If debugging, show the markdown after the markup
    follow("debug", function(name) {
      var text = '';
      if (debug) {
        waypoint(name, name);
        text =
          '<hr />' +
          '<div align="left" style="color:white; background-color:black;">' +
          '<pre>\n' +
          source +
          '</pre>' +
          '</div>';
      }
      target += text;
    });

    section.innerHTML = target;
  };
  //___________________________________________________________________________
  // markup function ends here.
  //___________________________________________________________________________

  //___________________________________________________________________________
  // HTML5 Header
  follow("HTML5:header", function(name) {
    markup(document.getElementsByTagName("header")[0]);
  });

  //___________________________________________________________________________
  // HTML5 Nav
  follow("HTML5:section", function(name) {
    var body        = document.getElementsByTagName("body")[0];
    var menu        = document.getElementsByTagName("nav")[0];
    var sections    = document.getElementsByTagName("section");
    var illformed   = HEREDOC(function() {/*
          <section id="HOME">
          <h1 align="center">Ill formed markdown</h1>
          </section>
      */});
    if (!sections) {
      var old = body.innerHTML;
      body.innerHTML = illformed;
    }
    var page        = document.getElementById(urlParams.get('page'));
    page            = page ? page : sections[0];
    stable          = page;
    if (typeof page === "undefined" || page == null) {
      body.innerHTML = illformed;
      return;
    }
    var pageid      = page.getAttribute("id");
    var count       = 0;
    var perline     = 5;
    var owner       = 'Jonathan D. Lettvin';
    if (typeof __legal__ !== "undefined" && __legal__.owner === "undefined")
      owner = __legal__.owner;

    // Generate the list of sections to populate the Nav bar.
    var html =
      '<small><small><small><small>' +
      'Copyright&copy; 2016-' +
      timestamp.getFullYear() +
      ' ' + owner + ', All Rights Reserved' +
      '</small></small></small></small>';
    html +=
      '<table class="nav" align="center"><tr>';
    Array.prototype.forEach.call(sections, function(section) {
      var style = [
        {'td': 'background-color:white;', 'a': 'color:black;'},
        {'td': 'background-color:black;', 'a': 'color:white;'}];

      var css = ['ignore', 'chosen'];

      var id = section.getAttribute("id");
      var chosen = + (pageid == id);
      var tdstyle = style[chosen]['td'];
      var tdcss = css[chosen];
      var astyle = style[chosen]['a'];
      var path = 'document.xenophilia.indivisible.code.';
      waypoint(name, id);
      if ((count % perline) == 0) html += '</tr><tr>';
      count++;
      var td =
        '<td class="nav"'   +
        //' class="' + css[+!chosen] + '"' +
        ' style="'          + tdstyle + '"' +
        ' id="mouse'        + id + '"' +
        ' onmouseenter="'   + path + 'mouseEnter(\'' + id + '\')"' +
        ' onclick="'        + path + 'mouseClick(\'' + id + '\')"' +
        ' onmouseleave="'   + path + 'mouseLeave(\'' + id + '\')"' +
        '>'                 +
        '<a href="?page='   + id + '"' +
        //' class="' + css[+chosen] + '"' +
        ' style="'          + astyle + '"' +
        '>'                 +
        '<big>'             + id + '</big>' +
        '</a>'              +
        '</td>';
      html += td;
      section.style.display = "none";
    });
    html += "</tr></table>";

    // If not debugging, give opportunity to debug
    if (!debug) {
        html += 
        '<a href="?page=' + pageid + '&debug=true">' +
        '<small>debug</small>' +
        '</a>';
    }

    // Show the menu.
    if (menu) menu.innerHTML = html;

    // Only show the chosen page.
    if (page) {
      page.style.display = "inline";
      markup(page);
    }
  });

  //___________________________________________________________________________
  // HTML5 Footer
  follow("HTML5:footer", function(name) {
    var elements    = document.getElementsByTagName("footer");
  });

  var code = document.xenophilia.indivisible.code;
  code.hover = hover;
  code.stable = stable;

  code.mouseEnter = function(hover) {
    // console.log('Enter: ' + key);
    /*
    var code = document.xenophilia.indivisible.code;
    code.hover = hover
    var stable = code.stable;

    document.getElementById('hover').innerHTML = hover;
    if (stable) document.getElementById(stable).style.display = "none";
    if (hover ) document.getElementById(hover ).style.display = "inline";
    */
  }
  code.mouseClick = function(key) {
    // console.log('Click: ' + key);
    /*
    stable = hover = key;
    */
  }
  code.mouseLeave = function(key) {
    // console.log('Leave: ' + key);
    /*
    var code = document.xenophilia.indivisible.code;
    var stable = code.stable;
    var hover  = code.hover;

    document.getElementById('hover').innerHTML = '_';
    if (stable) document.getElementById(stable).style.display = "inline";
    if (hover ) document.getElementById(hover).style.display = "none";
    code.hover = null
    */
  }

  waypoint(null);
});
