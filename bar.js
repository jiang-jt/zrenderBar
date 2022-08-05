var NAMESPACE = "dircard";
var ELEMENT_VIEWER = document.createElement(NAMESPACE);

function randomColor() {
  var color = "#";
  for (var i = 0; i < 6; i++)
    color += parseInt(Math.random() * 16).toString(16);
  return color;
}
// 
function calculateRulerMark(cormax, cormin, cornumber) {
  var tmpmax, tmpmin, corstep, tmpstep, tmpnumber, temp, extranumber;
  if (cormax <= cormin) return;
  corstep = (cormax - cormin) / cornumber;
  if (Math.pow(10, parseInt(Math.log(corstep) / Math.log(10))) == corstep) {
    temp = Math.pow(10, parseInt(Math.log(corstep) / Math.log(10)));
  } else {
    temp = Math.pow(10, parseInt(Math.log(corstep) / Math.log(10)) + 1);
  }
  tmpstep = (corstep / temp).toFixed(6);
  //选取规范步长
  if (tmpstep >= 0 && tmpstep <= 0.1) {
    tmpstep = 0.1;
  } else if (tmpstep >= 0.100001 && tmpstep <= 0.2) {
    tmpstep = 0.2;
  } else if (tmpstep >= 0.200001 && tmpstep <= 0.25) {
    tmpstep = 0.25;
  } else if (tmpstep >= 0.250001 && tmpstep <= 0.5) {
    tmpstep = 0.5;
  } else {
    tmpstep = 1;
  }
  tmpstep = tmpstep * temp;
  if (parseInt(cormin / tmpstep) != cormin / tmpstep) {
    if (cormin < 0) {
      cormin = -1 * Math.ceil(Math.abs(cormin / tmpstep)) * tmpstep;
    } else {
      cormin = parseInt(Math.abs(cormin / tmpstep)) * tmpstep;
    }
  }
  if (parseInt(cormax / tmpstep) != cormax / tmpstep) {
    cormax = parseInt(cormax / tmpstep + 1) * tmpstep;
  }
  tmpnumber = (cormax - cormin) / tmpstep;
  if (tmpnumber < cornumber) {
    extranumber = cornumber - tmpnumber;
    tmpnumber = cornumber;
    if (extranumber % 2 == 0) {
      cormax = cormax + tmpstep * parseInt(extranumber / 2);
    } else {
      cormax = cormax + tmpstep * parseInt(extranumber / 2 + 1);
    }
    cormin = cormin - tmpstep * parseInt(extranumber / 2);
  }
  cornumber = tmpnumber;
  return [cormax, cormin, cornumber];
}

//globle
var stroke = "#C0D0E0";
class Bar {
  constructor(element, options) {
    this.DEFAULTS = {
      data: [],
      wellSec: "段",
      //展示的列
      showCol: "",
      //柱颜色
      barColor: ["#48c15e", "#dff0d8"],
      //选中颜色
      checkColor: ["#ff5454", "#FF8053"],
      activeColor: "#ffc107",
      unChoseColor: "#ccc",
      //背景色
      backgroundColor: "#fff",
      //绘制完成后的回调函数
      rowAfter: false,
      title: "柱状图",
      xAxis: {
        data: [
          "一月",
          "二月",
          "三月",
          "四月",
          "五月",
          "六月",
          "七月",
          "八月",
          "九月",
          "十月",
          "十一月",
          "十二月",
        ],
      },
    };
    this.element = element;
    this.$element = element;
    this.options = Object.assign(
      {},
      this.DEFAULTS,
      { barColor: [randomColor(), randomColor(), randomColor()] },
      options
    );
    this.zr = zrender.init(this.element);
    this.w = this.zr.getWidth();
    this.h = this.zr.getHeight();

    this.disLeft = 0.15;
    this.disTop = 0.1;
    this.disBottom = 0.1;
    this.disRight = 0.1;

    this.zrEleArray = [];
    this.preZrEle = "";
    this.originLinearColor = "";
    this.activeBar = [];
    this.activeBarData = [];
    // 背景
    this.zrBGGroup = new zrender.Group();
    this.zrBGGroup.position = [0, 0];
    this.zr.add(this.zrBGGroup);

    // 图例
    this.zrLegendGroup = new zrender.Group();
    this.zrLegendGroup.position = [0, 0];
    this.zr.add(this.zrLegendGroup);

    // 柱状图
    this.zrColGroupArr = [];

    // Tips
    this.zrTipGroup = new zrender.Group();
    this.zrTipGroup.position = [0, 0];
    this.zrTipGroup.add(
      new zrender.Rect({
        shape: {
          width: 80,
          height: 35,
        },
        style: {
          fill: "#fff",
          stroke: "#ccc",
          text: "Tips",
          textFill: "red",
        },
      })
    );
    this.init();
  }
  init() {
    var options = this.options;
    var data = options.data;
    // 全部渲染出来
    data.forEach((item, index) => {
      this.activeBar.push(index);
    });
    this.length = options.xAxis.data.length;
    this.drawBG();
    this.drawYScale();
    this.options.legends && this.drawLegend();

    this.drawEle(this.activeBar);

    // callBack after draw
    if (options.rowAfter) {
      options.rowAfter();
    }
  }
  drawBG() {
    var zrBGGroup = this.zrBGGroup;
    var zr = this.zr;
    var w = this.w;
    var h = this.h;
    var xAxis = this.options.xAxis;
    var backgroundColor = this.options.backgroundColor;

    var disLeft = this.disLeft * w;
    var disRight = this.disRight * w;
    var disTop = this.disTop * h;
    var disBottom = this.disBottom * h;
    var i;
    var bg = new zrender.Rect({
      shape: {
        cx: 0,
        cy: 0,
        width: w,
        height: h,
      },

      style: {
        fill: backgroundColor,
      },
      /*zlevel: -1*/
    });
    zrBGGroup.add(bg);
    var roundRect = new zrender.Rect({
      shape: {
        cx: 0,
        cy: 0,
        width: 0.98 * w,
        height: 0.98 * h,
      },
      style: {
        stroke: stroke,
        fill: "#fff",
      },
      position: [0.01 * w, 0.01 * h],
    });
    zrBGGroup.add(roundRect);
    // xline
    var xline = new zrender.Line({
      shape: {
        x1: disLeft,
        y1: h - disTop,
        x2: w - disRight,
        y2: h - disTop,
      },
      style: {
        stroke: stroke,
      },
    });
    // yline
    var yline = new zrender.Line({
      shape: {
        x1: disLeft,
        y1: disTop,
        x2: disLeft,
        y2: h - disTop,
      },
      style: {
        stroke: stroke,
      },
    });
    zrBGGroup.add(xline);
    zrBGGroup.add(yline);

    var xLineScale = (this.xLineScale = Math.floor(
      (w - disRight - disLeft) / xAxis.data.length
    ));
    for (i = 1; i <= xAxis.data.length; i++) {
      var smline = new zrender.Line({
        shape: {
          x1: 0,
          y1: 0,
          x2: 0,
          y2: 0.02 * h,
        },
        style: {
          stroke: stroke,
        },
        position: [disLeft + xLineScale * i, h - disBottom],
      });
      var smText = new zrender.Text({
        style: {
          stroke: "#434348",
          text: xAxis.data[i - 1],
          fontSize: "11",
          textAlign: "center",
        },
        position: [
          disLeft + xLineScale * i - xLineScale / 2,
          h - disBottom + 0.03 * h,
        ],
      });
      zrBGGroup.add(smline);
      zrBGGroup.add(smText);
    }
    // title
    zrBGGroup.add(
      new zrender.Text({
        style: {
          text: this.options.title,
          fontSize: "18",
          fontWeight: "bold",
          textAlign: "center",
        },
        position: [w / 2, disTop - 20],
      })
    );
  }
  drawYScale() {
    var minData, maxData;
    var w = this.w;
    var h = this.h;
    var zrBGGroup = this.zrBGGroup;
    this.activeBar.forEach((item) => {
      this.activeBarData.push(this.options.data[item]);
    });
    var data = this.options.data && this.activeBarData.flat(1);
    this.maxData = Math.ceil(Math.max(...data) / 100) * 100;
    this.minData = Math.min(...data);
    var disLeft = this.disLeft * w;
    var disRight = this.disRight * w;
    var disTop = this.disTop * h;
    var disBottom = this.disBottom * h;
    var yLineScale = (this.yLineScale = (
      (h - disBottom - disTop) /
      this.maxData
    ).toFixed(2));
    // yAxis
    for (let i = 0; i <= this.maxData; i += 50) {
      var smline = new zrender.Line({
        shape: {
          x1: -7,
          y1: 0,
          x2: 0,
          y2: 0,
        },
        style: {
          stroke: stroke,
        },
        position: [disLeft, h - disTop - yLineScale * i],
      });
      var smText = new zrender.Text({
        style: {
          stroke: "#434348",
          text: i,
          fontSize: "11",
          textAlign: "center",
        },
        position: [disLeft - 20, h - disTop - yLineScale * i - 4],
      });
      zrBGGroup.add(smline);
      zrBGGroup.add(smText);
    }
  }
  // 绘制图例
  drawLegend() {
    // 渲染图例时，根据现有的柱状图数量来渲染，如果图例传了name，就根据图例传递的name进行渲染，
    // 如果没有，那么就按照柱状图设置的name进行展示
    var that = this;
    var unChoseColor = this.options.unChoseColor;
    var w = this.w;
    var h = this.h;
    var disLeft = this.disLeft * w;
    var disRight = this.disRight * w;
    var disTop = this.disTop * h;
    var disBottom = this.disBottom * h;
    var legends = this.options.legends ? this.options.legends : [];
    var zrLegendGroup = this.zrLegendGroup;
    for (let i = 0; i < legends.length; i++) {
      var activeColor = this.options.barColor;
      var legend = new zrender.Rect({
        shape: {
          r: [5],
          width: 25,
          height: 15,
        },
        name: "legend" + i,
        style: {
          fill: activeColor[i],
        },
        position: [disLeft - 100, disTop + 40 * i + 20],
      });
      zrLegendGroup.add(legend);
      zrLegendGroup.add(
        new zrender.Text({
          style: {
            text: legends[i],
            fontSize: "13",
            textFill: "#000",
            textAlign: "center",
          },
          position: [disLeft - 90, disTop + 40 * i + 40],
          name: "legendText" + i,
        })
      );
      legend.on("click", function () {
        console.log("触发", this.name);
        // 点击图例之后显示对应的柱状图
        console.log("点击的柱状图索引", this.name[this.name.length - 1]);
        let curLegend = zrLegendGroup.childOfName(this.name);
        let curLegendText = zrLegendGroup.childOfName("legendText" + i);
        let index = that.activeBar.indexOf(i);
        if (index !== -1) {
          // 已经展示了，此时隐藏
          curLegend.attr({
            style: {
              fill: unChoseColor,
            },
          });
          curLegendText.attr({
            style: {
              textFill: unChoseColor,
            },
          });
          // BUG：无法全部删除，每删一个会跳过一个。
          // that.zrColGroup.eachChild((child) => {
          //    if (child.name === "bar" + i) {
          //      console.log('1');
          //      that.zrColGroup.remove(child);
          //    }
          //   console.log(child);
          //
          // });
          that.activeBar.splice(index, 1);
          that.zr.remove(that.zrColGroupArr.splice(index, 1));
          // that.adjustBar();
        } else {
          that.activeBar.push(i);
          console.log(that.activeBar);
          that.drawEle();
          curLegend.attr({
            style: {
              fill: activeColor[i],
            },
          });
          curLegendText.attr({
            style: {
              textFill: "#000",
            },
          });
        }
      });
    }
  }
  drawEle(addArr) {
    addArr = addArr ? addArr : [this.activeBar[this.activeBar.length - 1]];
    var self = this;
    var options = this.options;
    var zr = this.zr;
    var w = this.w;
    var h = this.h;
    var zrTipGroup = this.zrTipGroup;
    var disLeft = this.disLeft * w;
    var disBottom = this.disBottom * h;

    var xAxis = this.options.xAxis;
    /**
     * 可以传入多个数据段，初始化时全部渲染到页面上，通过设置图例可以控制显示或隐藏柱状图，
     * 控制显示或隐藏时，需要重新调整其他柱状图的位置，根据柱状图渲染顺序来进行向左或向右动画，
     */
    let avgScale = Math.ceil(this.xLineScale / (this.zrLegendGroup.childCount()/2));
    for (let i = 0; i < addArr.length; i++) {
      let data = options.data[addArr[i]];
      /**
       * 控制每一个柱状图的坐标
       * 计算出每一个的刻度间隔进行位置均分
       * */
      let range = avgScale * addArr[i] + 2;
      let zrColGroup = new zrender.Group();
      for (let j = 0; j < this.length; j++) {
        let xPoint = disLeft + this.xLineScale * j + range;
        let yPoint = h - disBottom;
        var zrEle = new zrender.Rect({
          name: "bar" + i,
          shape: {
            cx: 0,
            cy: 0,
            width: avgScale - 2,
            height: 0,
          },
          style: {
            fill: this.options.barColor[addArr[i]],
          },
          position: [xPoint, yPoint],
          // silent: true  //不响应鼠标事件
        });
        zrEle.on("mousemove", function (e) {
          var child = zrTipGroup.childAt(0);
          child.attr({
            style: {
              text: self.options.legends[addArr[i]] + ":" + data[j],
            },
          });
          // console.log(xPoint, yPoint);
          zrTipGroup.position = [e.offsetX, e.offsetY];
          zr.add(zrTipGroup);
        });
        zrEle.on("mouseout", function () {
          zr.remove(zrTipGroup);
        });

        zrEle.rowIndex = j;
        // bind click event
        // self.clickEle(zrEle);

        zrEle.animateTo(
          {
            shape: {
              height: this.yLineScale * data[j],
            },
            position: [xPoint, h - disBottom - this.yLineScale * data[j]],
          },
          500,
          j * 100,
          "linear"
        );
        this.zrEleArray.push(zrEle);
        zrColGroup.add(zrEle);
      }
      this.zrColGroupArr.push(zrColGroup);
      zr.add(zrColGroup);
    }
    // 调整其他柱状的位置
    //this.adjustBar();
  }
  adjustBar() {
    let avgWidth = Math.ceil(this.xLineScale / this.activeBar.length);
    for (let i = 0; i < this.zrColGroupArr.length; i++) {
      this.zrColGroupArr[i].eachChild(function (child) {
        child.attr({
          shape: {
            width: avgWidth - 2,
          },
        });
      });
    }
  }
  activeEle(index) {
    var zr = this.zr;
    var options = this.options;
    var checkColor = options.checkColor;
    var w = this.w;
    var h = this.h;
    var disLeft = this.disLeft * w;
    var disBottom = this.disBottom * h;
    var data = options.data;

    if (index < this.length) {
      this.removeActiveEle();
      //改变添加部分
      var checkZr = this.zrEleArray[index];
      if (checkZr) {
        this.preZrEle = checkZr;
        //设置元素属性
        checkZr.attr({
          style: {
            /* stroke: '#FF5454',*/
            lineWidth: 4,
            fill: new zrender.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: checkColor[0],
              },
              {
                offset: 1,
                color: checkColor[1],
              },
            ]),
          },
        });
        //提示虚线
        var tipLine = new zrender.Line({
          shape: {
            x1: disLeft,
            y1: h - disBottom - this.yLineScale * data[index],
            x2: disLeft + this.xLineScale * (index + 1) - 15,
            y2: h - disBottom - this.yLineScale * data[index],
            percent: 0,
          },
          style: {
            stroke: "#434348",
            lineDash: [5, 5],
          },
        });
        tipLine
          .animate("shape", false)
          .when(500, {
            percent: 1,
          })
          .start();
        zr.add(tipLine);
        this.tipLine = tipLine;
        //提示文字
        var tipText = new zrender.Text({
          style: {
            stroke: "#434348",
            text: data[index],
            fontSize: "10",
          },
          position: [
            disLeft + this.xLineScale * (index + 1) - 10,
            h - disBottom - this.yLineScale * data[index] - 10,
          ],
        });
        zr.add(tipText);
        this.tipText = tipText;
      }
    } else {
      console.log("该索引下没有zrender元素");
    }
  }
  removeActiveEle() {
    var zr = this.zr;
    //恢复移除部分
    if (this.preZrEle) {
      this.preZrEle.attr({
        style: {
          stroke: null,
          lineWidth: 0,
          fill: "#127ed4",
        },
      });
    }
    if (this.tipLine) {
      zr.remove(this.tipLine);
    }
    if (this.tipText) {
      zr.remove(this.tipText);
    }
  }
  clickEle(zrEle) {
    var self = this;
    zrEle.on("click", function () {
      var rowIndex = zrEle.rowIndex;
      self.activeEle(rowIndex);
    });
  }
  dispose() {
    var zr = this.zr;
    zrender.dispose(zr);
  }
}
