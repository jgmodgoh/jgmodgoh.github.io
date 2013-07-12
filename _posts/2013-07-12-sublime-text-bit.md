---
layout: post
title: Sublime Text 2 snippet
description: "Running code from the console of Sublime Text 2."
category: bits
tags: [Sublime Text 2, Load Path, Console, Tips]
comments: true
---

To run code from the console of [Sublime Text](http://www.sublimetext.com/), simply use the shortcut `cmd+b`. This is a convenient way to view results from your code in addition to using irb.

<figure>
  <img src="/images/2013-7-12-bit-1.png">
</figure>

However, if this is the first time you are running code from Sublime Text, you might encounter an error when ruby tries to require a file. The problem is the default load path in Sublime Text might not include where your ruby gems are intalled. A simple fix is to get your load path from the bash terminal with the command `echo $PATH`.

<figure>
  <img src="/images/2013-7-12-bit-2.png">
</figure>

Then copy the output and paste it into the file `~/Library/Application\ Support/Sublime\ Text\ 2/Packages/Ruby/Ruby.sublime-build` as below:   

<figure>
  <img src="/images/2013-7-12-bit-3.png">
</figure>

That should solve the problem.