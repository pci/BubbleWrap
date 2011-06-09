/*
*
*    Copyright (c) 2011 Phil Ingrey, <philingrey.com>
*
*    Licensed under the MIT license - see ./license.txt
*
*
*/


// A standard 2D vector
function Vector2D(x, y){
   this.x = x;
   this.y = y;
   
   this.setV = function(x, y){
      this.x = x;
      this.y = y;
   }
   
   this.drawline = function(x1,y1,x2,y2) {
   	  // line from p1 to p2
   	  this.x = x2-x1;
   	  this.y = y2-y1;
   }
   
   this.normalize = function() {
      this.magnitude = Math.sqrt((this.x * this.x) + (this.y * this.y));
      if(this.magnitude == 0) return;
      
      this.x = this.x / this.magnitude;
      this.y = this.y / this.magnitude;
   }
   
   this.mult = function(m){
      return new Vector2D(this.x*m,this.y*m);
   }
   
   this.multEquals = function(m){
      this.x *= m;
      this.y *= m;
   }
   
   this.minus = function(v){
      return new Vector2D(this.x-v.x, this.y-v.y);
   }
   
   this.addEquals = function(v2){
   	  this.x+=v2.x;
   	  this.y+=v2.y;
   }
};


function Bubble(x, y, canvasid){
   
   this.left = x;
   this.top = y;
   this.mycanvas = document.getElementById(canvasid);
   this.ctx = this.mycanvas.getContext('2d');
   this.mywidth = this.mycanvas.width;
   this.myheight = this.mycanvas.height;
   this.right = x+this.mywidth;
   this.bottom = y+this.myheight;
   this.data = this.ctx.getImageData(0,0,this.mywidth,this.myheight).data;
   this.f = new Vector2D(0,0);
   this.weight = 0;

   // Calculate the weight
   for(var i=0;i<this.myheight;i++){
       for(var j=0;j<this.mywidth;j++){
           if(this.data[4*(this.mywidth*i+j)+3] != 0) this.weight++;
       }
   }
   
   this.draw = function(canvasid) {      
      var cx = document.getElementById(canvasid).getContext('2d');
      
      cx.drawImage(this.ctx.canvas, this.left, this.top);
   }
   
   this.distanceTo = function(x, y) {
      /*var dx = this.x - x;
      var dy = this.y - y;
      
      return Math.sqrt((dx*dx) + (dy*dy));*/
   }
   
   this.moveBy = function(v) {
      this.left += v.x;
      this.right += v.x;
      this.top += v.y;
      this.bottom += v.y;
   }
   
   this.contains = function(x, y) {
   	  // returns if a point is within this bubble
   	  return ((this.left < x && x < this.right) && (y < this.top && this.bottom < y));
   }
   
   this.intersects = function(secondBubble) {
      // returns the overlap between two bubbles in the form [[x1,y1], [x2,y2]] (the first being the upper left corner of the intersection)
      // returns null if no overlap present
      var lowesttop = Math.max(this.top, secondBubble.top);
      var highestbottom = Math.min(this.bottom, secondBubble.bottom);
      var rightmostleft = Math.max(this.left, secondBubble.left);
      var leftmostright = Math.min(this.right, secondBubble.right);
      
      if(rightmostleft > leftmostright || lowesttop > highestbottom) return null;
      
      return [[rightmostleft,lowesttop],[leftmostright,highestbottom]];
   }
   
   this.usedPoint = function(x, y){
   	  // returns true if the point (x, y) has some importance in this canvas (i.e. it's opacity channel is non-zero)
   	  // assume the point is in this bubble (maybe should do checking, but it'll slow things down a lot!)
   	  return (this.data[4*(this.mywidth*(y-this.top)+(x-this.left))+3] != 0)
   }
};

// Main BubbleWraping class
function BubbleWrap(bubbles, maincanvasid){

   this.bubbles = bubbles;
   this.maincanvas = document.getElementById(maincanvasid);
   this.ctx = this.maincanvas.getContext('2d');
   this.damping = 0.98;
   this.canvasCenter = new Vector2D(this.maincanvas.width / 2, this.maincanvas.height / 2);
   this.timer = null;
   var that = this;
   
   this.draw = function() {
   		// clear the canvas
        this.ctx.clearRect(0,0,this.maincanvas.width, this.maincanvas.height);
        for(var i in this.bubbles){
            this.bubbles[i].draw(maincanvasid);
        }
   }
   
   var callBack = function()
   {
        that.iterate();
   }
   
   this.iterate = function(){
   		var overlap;
   		var forcesum;
   		var df = new Vector2D(0,0);
   		var bi,bj;
   		var kave, lave;
   		for(var i=0;i<this.bubbles.length;i++) bubbles[i].f.setV(0,0);
   		
   		for(var i=0;i<this.bubbles.length;i++){
   			bi = bubbles[i];
   			for(var j=i+1;j<this.bubbles.length;j++){
   				bj = bubbles[j];
   				overlap = bi.intersects(bj);
   				if(overlap !== null){
   					//this.ctx.strokeRect(overlap[0][0],overlap[0][1],overlap[1][0]-overlap[0][0],overlap[1][1]-overlap[0][1]);
   					
   					forcesum = 0;
   					kave = lave = 0;
   					
   					for(var k=overlap[0][0]; k<overlap[1][0]; k++){
   						for(var l=overlap[0][1]; l<overlap[1][1]; l++){
   							if(bi.usedPoint(k,l) && bj.usedPoint(k,l)) {
   								// clash point
   								forcesum++;
   								kave += k;
   								lave += l;
   								//this.ctx.fillRect(k-0.5,l-0.5,1,1);
   							}
   						}
   					}
   					if(forcesum == 0) continue;
   					df.setV((bi.left+bi.mywidth/2)-kave/forcesum,(bi.top+bi.myheight/2)-lave/forcesum);
   					df.normalize();
   					//bi.f.addEquals(df.mult(50*forcesum/bi.weight));
   					df.setV((bj.left+bj.mywidth/2)-kave/forcesum,(bj.top+bj.myheight/2)-lave/forcesum);
   					df.normalize();
   					//bj.f.addEquals(df.mult(50*forcesum/bj.weight));
   				}
   			}
        }
        
        for(var i=0;i<this.bubbles.length;i++) {
        	    // gravity:
        	    df.setV(this.canvasCenter.x-(bubbles[i].left+bubbles[i].mywidth/2),this.canvasCenter.y-(bubbles[i].top+bubbles[i].myheight/2));
        	    df.normalize();
        	    bubbles[i].f.addEquals(df.mult(5*this.damping));
        	    bubbles[i].moveBy(bubbles[i].f);
        }
        
        this.damping *= 0.98;
        this.draw();
        if(this.damping > 0.02) this.timer = window.setTimeout(callBack,50);
   }
};
