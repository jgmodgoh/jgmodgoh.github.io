---
layout: post
title: Cassandra and Ruby
description: "setting up a cluster with 3 nodes."
category: articles
tags: [Cassandra, Ruby]
comments: true
---
## Introduction
This is an introductory post on setting up a multi node cluster with Cassandra and running queries on a sample data set using ruby.

The first half of this post gives a quick rundown of installing and configuring Cassandra to run with 3 nodes on a mac. The second half inserts a sample data set and queries Cassandra using the ruby gem [cql-rb](https://github.com/iconara/cql-rb).

***

## Cassandra
As part of the family of NoSQL databases, Cassandra stands out as a peer-to-peer distributed database system, with linear scale performance and no single point of failure. [Datastax](http://www.datastax.com/documentation/cassandra/2.0/webhelp/index.html#cassandra/architecture/architectureIntro_c.html) provides a great description of Cassandra and its components. 

*****

## Installing Cassandra as a single node cluster
Java version 7 and python must be installed to run Cassandra version 2.0. Check your version of java from your terminal with `java -version`. You can update to the latest version from System Preferences->Other->Java update tab. Then, from the Java Control Panel:
<figure>
  <img src="/images/2013-09-24-blog/1.png">
</figure>
click View and copy the path.
<figure>
  <img src="/images/2013-09-24-blog/2.png">
</figure>
And add to your ~/.bash_profile this line `export JAVA_HOME=<your copied path>`. You should check that your bash terminal is now running Java version 7.
<figure>
  <img src="/images/2013-09-24-blog/3.png">
</figure>
Next download the latest version of Cassandra on [Datastax](http://www.datastax.com/documentation/gettingstarted/index.html#getting_started/gettingStartedTar_t.html). The following steps are taken from their website.

From your bash window:
  
  1) Download the tarball
  {% highlight bash %}
  ~> curl -OL http://downloads.datastax.com/community/dsc.tar.gz
  {% endhighlight %}
  
  2) Unpack the distribution and cd into the directory
  {% highlight bash %}
  ~> tar -xvzf dsc.tar.gz
  ~> cd dsc-cassandra-2.0.0 
  {% endhighlight %}
  
  3) You can install without root permissions
  {% highlight bash %}
  ~dsc-cassandra-2.0.0> mkdir cassandra-data; cd cassandra-data
  ~dsc-cassandra-2.0.0/cassandra-data> mkdir data saved_caches commitlog
  {% endhighlight %}
  
  4) Edit cassandra.yaml in the /conf directory
  {% highlight yaml %}
  #conf/cassandra.yaml
  initial_token: 0
  data_file_directories: - <path_to_install>/cassandra-data/data
  ..
  commitlog_directory: <path_to_install>/cassandra-data/commitlog
  ..
  saved_caches_directory: <path_to_install>/cassandra-data/saved_caches
  {% endhighlight %}

  5) Edit log4j-server.properties in the /conf directory
  {% highlight yaml %}
  #conf/log4j-server.properties
  log4j.appender.R.File= <path_to_install>/cassandra-data/system.log
  {% endhighlight %}

  6) Start the node from the install directory
  {% highlight bash %}
  ~dsc-cassandra-2.0.0> bin/cassandra -f
  {% endhighlight %}

  7) Check that the node is running
  {% highlight bash %}
  ~dsc-cassandra-2.0.0> bin/nodetool status
  Datacenter: datacenter1
  =======================
  Status=Up/Down
  |/ State=Normal/Leaving/Joining/Moving
  --  Address    Load       Tokens  Owns   Host ID                               Rack
  UN  127.0.0.1  100.1 KB   256     100.0%  c438dbf0-822f-4949-ac31-a2bb2e74ba5c  rack1
  ~dsc-cassandra-2.0.0> 
  {% endhighlight %}


Some of you might run into this error when firing up the node.
{% highlight bash%}
java.net.MalformedURLException: Local host name unknown:
{% endhighlight %}
To resolve this, simply run the command `scutil –set HostName “localhost”` in your terminal and try again. The node should start up fine now.

***

## Configuring Cassandra as a multi-node cluster
For this setup I have chosen to run 3 nodes on my mac. To create the second and third node, duplicate the contents of folder `dsc-cassandra-2.0.0` and rename them `dsc-cassandra-2.0.0b` and `dsc-cassandra-2.0.0c`. Then edit their `conf/cassandra.yaml` and `log4j-server.properties` files.


{% highlight yaml %}
#dsc-cassandra-2.0.0b/conf/cassandra.yaml
listen_address: 127.0.0.2
...
rpc_address: 127.0.0.2
...
..
.
  - seeds: "127.0.0.1"
...
..
.
data_file_directories:
    - <install directory>/dsc-cassandra-2.0.0b/cassandra-data/data
..
commitlog_directory: <install directory>/dsc-cassandra-2.0.0b/cassandra-data/commitlog
..
saved_caches_directory: /<install directory>/dsc-cassandra-2.0.0b/cassandra-data/saved_caches
{% endhighlight %}
    

{% highlight yaml %}
#dsc-cassandra-2.0.0b/conf/log4j.appender.R.File
log4j.appender.R.File= <install directory>/dsc-cassandra-2.0.0b/cassandra-data/system.log
{% endhighlight %}

Cassandra version 2.0 runs Murmur3Partitioner by default with vnodes. In the cassadra.yaml file, you can comment out the line beginning with `initial_token`. We do not need this for now.

Next open `conf/cassandra-env.sh` and change `JMX_PORT` from the default 7199 to 7200.

Make these same changes for the third node in `dsc-cassandra-2.0.0c` replacing addresses with 127.0.0.3 and `JMX_PORT` with 7201.  

I encountered the following error message while starting up nodes 2 and 3 initially:

{% highlight bash %}
java.net.BindException: Can't assign requested address
{% endhighlight %}

To rectify this, you will need to alias the 2 additional addresses to loopback by entering `sudo ifconfig lo0 add 127.0.0.2` and `sudo ifconfig lo0 add 127.0.0.3` in your terminal.

Now fire up all 3 nodes with `bin/cassandra -f`. You should see the server on 127.0.0.1 log the following lines:

{% highlight bash%}
INFO 22:11:15,653 Startup completed! Now serving reads.
 INFO 22:11:15,731 Starting listening for CQL clients on localhost/127.0.0.1:9042...
 INFO 22:11:15,748 Binding thrift service to localhost/127.0.0.1:9160
 INFO 22:11:15,784 Using TFramedTransport with a max frame size of 15728640 bytes.
 INFO 22:11:15,795 Using synchronous/threadpool thrift server on localhost : 9160
 INFO 22:11:15,796 Listening for thrift clients...
 INFO 22:11:28,495 Handshaking version with /127.0.0.2
 INFO 22:11:28,724 Node /127.0.0.2 has restarted, now UP
 INFO 22:11:28,741 Handshaking version with /127.0.0.2
 INFO 22:11:28,744 InetAddress /127.0.0.2 is now UP
 ...
 ..
 .
 INFO 09:25:09,801 Handshaking version with /127.0.0.3
 INFO 09:25:09,832 Node /127.0.0.3 is now part of the cluster
 INFO 09:25:09,841 Handshaking version with /127.0.0.3
 INFO 09:25:09,844 InetAddress /127.0.0.3 is now UP
 ...
{% endhighlight %}
Nodes 2 and 3 are now connected with node 1.

Finally confirm that all 3 nodes are indeed set up correctly by running `bin/nodetool status` in your terminal.
<figure>
	<img src="/images/2013-09-24-blog/4.png">
</figure>
You have just successfully set up a 3 node cluster. Go get yourself a drink!

***

## Inserting Data into Cassandra using Ruby
To experiment inserting data and querying Cassandra you can play around with [Cassandra Query Language (CQL)](http://www.datastax.com/documentation/cassandra/2.0/webhelp/index.html#cassandra/cql.html) directly by running `bin/cqlsh`. This will launch an interactive cql shell session. I would spend sometime getting comfortable with CQL3 just to get a feel of how the query api works. For this second half I will be using the [cql-rb](https://github.com/iconara/cql-rb) rubygem to perform some basic operations.

First I downloaded from google finance a sample data of prices from 3-Jan-78 to 20-Sep-13 for ticker "BAC". This has 9028 rows of observations with 6 columns - date, opening price, high price, low price, closing price and volume traded - stored as a .csv file. While Cassandra is designed for big data, here we use a small dataset as an introductory exercise to get a feel of its standard operations. Eventhough numerous benchmark tests on Cassandra have been done, it would nevertheless still be an interesting exercise to run some analytics against other databases. We shall leave that as an exercise for another time.

Data modeling in Cassandra is different from a [relational database management system (RDBMS)](http://en.wikipedia.org/wiki/Relational_database_management_system). The key difference is that data is stored as wide rows in Cassandra. More importantly, unique data is used for column names (or keys) making it much more efficient to retrieve a range of column values. This confused me initially. A good write up on [ebay tech blog](http://www.ebaytechblog.com/2012/08/14/cassandra-data-modeling-best-practices-part-2/) helped clarify many of my misinterpretations. 

For the timeseries, I used ticker as the unique row ID and dates as column keys. Column values include prices and volume traded for the day. Below is the script used to insert the dataset into the cluster. 

{% highlight ruby %}
#insert_data_to_cassandra_script.rb
require 'cql'
require 'date'
require 'benchmark'

keyspace_definition = <<-KSDEF
  CREATE KEYSPACE historical_data
  WITH replication = {
    'class': 'SimpleStrategy',
    'replication_factor': 3
  }
KSDEF

table_definition = <<-TABLEDEF
  CREATE TABLE prices (
    date timestamp,
    ticker text,
    open text,
    high text,
    low text,
    close text,
    volume text,
    PRIMARY KEY (ticker,date)
  )
TABLEDEF

client = Cql::Client.connect
client.execute(keyspace_definition)
client.use('historical_data')
client.execute(table_definition)

file = File.open("bac.csv")
file.readline("\r")

data = file.readlines
data = data[0].split("\r")

data.map! {|line| line.split(",")}
Benchmark.bm do |bm|
  bm.report do
    data.each do |row|
      date, open, high, low, close, volume = row
      client.execute("INSERT INTO prices (ticker,date,open,high,low,close,volume) VALUES ('bac','#{Date.parse(date)}','#{open}','#{high}','#{low}','#{close}','#{volume}')")
    end
  end
end

# =>      user     system      total        real
# =>  5.410000   0.800000   6.210000 ( 12.865264)
{% endhighlight %} 

Inserting data one row at a time is definitely not the most efficient. Looking at the system time - CPU time spent processing instructions from kernel code - writing 9028 rows using CQL took approximately 0.8s. Thankfully, CQL has a [batch](http://cassandra.apache.org/doc/cql3/CQL.html#batchStmt) method that allows for batch writes. 

{% highlight ruby %}
client.execute('DROP KEYSPACE historical_data')
client.execute(keyspace_definition)
client.use('historical_data')
client.execute(table_definition)

file = File.open("vxx.csv")
file.readline("\r")

data = file.readlines
data = data[0].split("\r")

batch_insert = "BEGIN BATCH "
data.each do |line|
  data_array = line.split(",")
  date, open, high, low, close, volume = data_array
  batch_insert += "INSERT INTO prices (ticker,date,open,high,low,close,volume) VALUES ('bac','#{Date.parse(date)}','#{open}','#{high}','#{low}','#{close}','#{volume}');"
end
batch_insert += " APPLY BATCH"
Benchmark.bm do |bm|
  bm.report {client.execute(batch_insert)}   
end

# =>      user     system      total        real
# =>  0.000000   0.010000   0.010000 (  5.549494)
{% endhighlight %}

Using batch assignment gave a massive improvement from roughly 0.8s to 0.01s. [Cassandra Query Language documentation](http://cassandra.apache.org/doc/cql3/CQL.html) states that the batch statement "saves network round-trips between the client and the server (and sometimes between the server coordinator and the replicas) when batching multiple updates."

***

## Querying Cassandra from Ruby
Querying Cassandra via the rubygem [cql-rb](https://github.com/iconara/cql-rb) uses plain CQL (other available Cassandra gems include [cassandra-cql](https://github.com/kreynolds/cassandra-cql) and [cassandra](https://github.com/twitter/cassandra)). First you will need to install the gem with `gem install cql-rb`.
Here are some sample queries you can perform on the database. For more examples take a look at the github homepage.


* Simple SELECT query
{% highlight ruby %}
irb> require 'cql'
# => true
irb> client = Cql::Client.connect({keyspace:'historical_data'})
# => nil
irb> client.execute('SELECT * FROM prices')
# => ......
{% endhighlight %}

* Conditional SELECT query 
{% highlight ruby %}
irb> historical_price = client.execute("SELECT * FROM prices WHERE ticker='bac' AND date>'2013-09-18'").to_a
# => nil
irb> historical_price[0]
# => {"ticker"=>"bac", "date"=>2013-09-19 00:00:00 -0400, "close"=>"14.61", "high"=>"14.83", "low"=>"14.58", "open"=>"14.8", "volume"=>"79710935"}
{% endhighlight %}

* INSERT new data
{% highlight ruby %}
irb> client.execute("INSERT INTO prices (ticker,date,open,high,low,close) VALUES ('bac','2013-09-23','14.31','14.32','14.09','14.14')")
# => nil
irb> client.execute("SELECT * FROM prices WHERE ticker='bac' AND date='2013-09-23'").to_a
# => [{"ticker"=>"bac", "date"=>2013-09-23 00:00:00 -0400, "close"=>"14.14", "high"=>"14.32", "low"=>"14.09", "open"=>"14.31", "volume"=>nil}]
{% endhighlight %}

According to the documentation for cql-rb, any valid CQL statement can be executed via the gem and the driver will return whatever Cassandra replies with.

***

## Conclusion
Getting Cassandra installed and configured to run as a simple multi node cluster on a single machine was not too difficult. Also, interacting with the database using the rubygem cql-rb is fairly straightforward, especially since it executes CQL statements. However, with so many available options, optimizing for a specific application use and knowing what each option does within Cassandra is definitely not trivial. I will be reading up and exploring these options next.

To help you, here is a list of online resources I found useful:

* [Datastax](http://www.datastax.com/documentation/cassandra/2.0/webhelp/index.html#cassandra/architecture/architectureIntro_c.html)
* [Planet Cassandra](http://planetcassandra.org/)
* [ebay tech blog](http://www.ebaytechblog.com/2012/08/14/cassandra-data-modeling-best-practices-part-2/)
* [Cassandra Query Language documentation](http://cassandra.apache.org/doc/cql3/CQL.html)

Enjoy.

***
