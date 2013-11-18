---
layout: post
title: Kalman Filter with Vasicek Model
description: "applying the Kalman Filter to the Vasicek Model"
category: articles
tags: [Kalman Filter, Vasicek]
comments: true
---


<!-- MathJax scripts -->
<script type="text/javascript" src="https://c328740.ssl.cf1.rackcdn.com/mathjax/2.2-latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML">
</script>
<script type="text/x-mathjax-config">
MathJax.Hub.Config({
  TeX: { equationNumbers: { autoNumber: "AMS" } },
  jax: [ "input/TeX", "output/SVG" ],
  displayAlign: "left",
  displayIndent: "1em"
});
</script>

## Introduction
I had a tough time understanding the Kalman Filter when I first encountered it. Seeing it only as a series of equations that magically did the job of filtering out relevant underlying data from noisy observations - not really grasping the nuts and bolts of how it worked. 

Going through the algorithm a second time, I found focusing on the intuition key to my learning and espcially in helping to plow through the equations. Most observations in time are recorded with instruments that include unwanted noise either from its surroundings or inherent in the machine, making it difficult to accurately study the time series of interest. Since time series are often modeled as driven by a sum of underlying factors that are both not observable and stochastic, there are then 2 challenges, that of separating actual observations from noise and that of extracting unobservable factors. This is made reasonably easy with the Kalman filter.

To better intuit the algorithm, consider a financial application where observations are given by zero-coupon bond prices driven by the latent short rate (comprising 1 or more factors). Traded prices throughout the day are measured as noisy observations with prices fluctuating around their true mean value. Here, the Kalman filter is applied with 2 steps - the predict step and the update step. The predict step estimates what the short rate at a particular time should be based on its previous value while the update step uses the observed prices as new information to adjust and update the predicted short rate. A chart might be helpful at this point. [^1] 

<figure>
  <a href="/images/2013-11-17-blog/kf_diagram.png"><img src="/images/2013-11-17-blog/kf_diagram.png"></a>
</figure>

The extent of adjustment in the update step is determined and tuned by a factor called the Kalman gain, essentially assigning levels of confidence to predicted rates and measured rates. This gives a weighted average of both rates. Specifically, a higher Kalman gain reflects more confidence in the model, with more weight placed on predicted rates and less on measured rates.

As an exercise to apply the Kalman filter, mulitple zero-coupon bond prices are simulated using the Vasicek model for short rates. (Here an [affine term structure model](http://en.wikipedia.org/wiki/Affine_term_structure_model) is used to generate bond prices.) As in practice, parameters of the model have to be calibrated to fit observed market prices, meaning the model has to be parameterized such that it is most likely to generate a short rate process consistent with market prices. To do so, the Kalman filtering algorithm together with simulated bond prices are fed into an optimization routine. This procedure then outputs the most probable model parameters by maximising a log-likelihood function based on the set of observations.

The following exercise is adapted from the paper by [David Jamieson Bolder at the Bank of Canada](http://www.bankofcanada.ca/2001/10/publications/research/working-paper-2001-15/) [^2]. First, the Kalman filter is layed out in detail, followed by writing out equations specific to the Vasicek model. Next, Monte Carlo simulations of short rates are executed to generate zero-coupon bond prices. Then using both bond prices and the Kalman filter, model parameters with a highest likelihood of producing these prices are determined. 

***

## Kalman Filter
The Kalman filter framework refers to the latent factor as the state of the system and the observable measurements as outputs generated from the unobservable state. Within a linear state space - all possible sets of states - system, a *linear* operator maps the state of the previous time to the current state with added noise. Then, a second *linear* operator maps the current state to observed measurements, with noise added again.

<p>In the context of this exercise, the short rate process \( r_t \) with state transition operator \( F_t \), state transition noise \( \epsilon_t \), observation operator \( A_t \) and observation noise \( e_t \)  is represented as:
\[ 
  \begin{equation}
  r_t = F_t r_{t-1} + \epsilon_t \\
  \end{equation} 
 \]
\[ 
  \begin{equation}
  Y_t = A_t r_t + B_{t} + e_t \\
  \end{equation}
 \]
where \( B_t \) is the intercept of the observation equation, and \( \epsilon_t \) and \( e_t \) are gaussian error terms with mean 0 and covariance \( \Sigma_{\epsilon} \) and \( \Sigma_e \).
</p>


The Kalman filter equations can be grouped into prediction steps and update steps: 

**prediction steps**
<ul>
<li>State prediction (a priori): 
\[ 
  \begin{equation}
  \hat{r}_{t|t-1} = F_t\hat{r}_{t-1|t-1} \\
  \end{equation} 
 \]</li>
<li><p>State covariance prediction (a priori):
\[ 
  \begin{equation}
  P_{t|t-1} = F_t P_{t-1|t-1} F_t^T + \epsilon_t \\
  \end{equation} 
 \]
with gaussian process noise \( \epsilon \sim N(0,\Sigma_{\epsilon}) \).</p></li>
</ul>

**update steps**
<ul>
<li><p>Kalman gain matrix
\[ 
  \begin{equation}
  K_t = P_{t|t-1}A_t ^T(A_{t}P_{t|t-1}A_{t}^T + e_{t})^{-1} \\
  \end{equation} 
 \]
with gaussian measurement noise \( e \sim N(0,\Sigma_e) \).</p></li>

<li><p>Innovation or measurement residual (forecast error)
\[ 
  \begin{equation}
  V_t = Y_t - (A_t \hat{r}_{t|t-1} + B_{t})
  \end{equation} 
 \]</p></li>

<li><p>Innovation or measurement residual covariance (variance of forecast error)
\[ 
  \begin{equation}
  \Sigma_t = A_t P_{t|t-1}A^T + \Sigma_e 
  \end{equation} 
 \]</p></li>

<li><p>Updated state estimate (a posteriori)
\[ 
  \begin{equation}
  \hat{r}_{t|t} = \hat{r}_{t|t-1} + K_t V_t
  \end{equation} 
 \]</p></li>

<li><p>Updated state covariance (a posteriori)
\[ 
  \begin{equation}
  P_{t|t} = (I - K_t A)P_{t|t-1} 
  \end{equation} 
 \]</p></li>
</ul>

***

## Vasicek Model
The Vasicek model follows an [Ornstein-Uhlenbeck process](http://en.wikipedia.org/wiki/Ornstein%E2%80%93Uhlenbeck_process):
<p>
\[ 
  \begin{equation}
  dr_t  = \kappa (\theta - r_t) dt + \sigma dW_t \\ 
  \end{equation}
 \]
where \( \kappa \) is the mean reversion strength, \( \theta \) is the long-term mean, \( \sigma \) is the volatility of the process and \( {W_t} \\ \) is a standard brownian motion.
</p>


<p>In an affine term structure model, zero-coupon bond prices have the form:
\[ 
  \begin{equation}
  P_t(\tau,r_t)=e^{A_t(\tau)-B_t(\tau)r_t}
  \end{equation}
 \]</p>

<p>with
\[ 
  \begin{aligned}
  B_t(\tau) &= \frac{1}{\kappa}\left(1-e^{-\kappa\tau}\right), \\
  A_t(\tau) &= \frac{\gamma(B_t(\tau)-\tau)}{\kappa^2} - \frac{\sigma^2B_t^2(\tau)}{4\kappa}, \\
  \gamma    &= \kappa^2\left(\theta-\frac{\sigma\lambda}{\kappa}\right) - \frac{\sigma^2}{2}
  \end{aligned}
 \]</p>

and zero-coupon yield:
<p>
\[ 
  \begin{equation}
  z_t(\tau) = -\frac{lnP_t(\tau)}{\tau} = -\frac{A_t(\tau)+B_t(\tau)r_t} {\tau}
  \end{equation}
 \]</p>

<br>
<p>The observation equation for n zero-coupon yields and 3 factors \( r(t)=y_1(t)+y_2(t)+y_3(t) \) are:
\[ 
  \begin{equation}
  \begin{bmatrix}
    z_{t_i}(\tau_{z_1}) \\
    z_{t_i}(\tau_{z_2}) \\
    \vdots \\
    z_{t_i}(\tau_{z_n}) \\
  \end{bmatrix} =
  \begin{bmatrix}
    -\frac{A_{t_i}(\tau_{z_1})}{\tau_{z_1}} \\
    -\frac{A_{t_i}(\tau_{z_2})}{\tau_{z_2}} \\
    \vdots \\
    -\frac{A_{t_i}(\tau_{z_n})}{\tau_{z_n}}
  \end{bmatrix} + 
  \begin{bmatrix}
    \frac{B_{1,t_i}(\tau_{z_1})}{\tau_{z_1}} & \frac{B_{2,t_i}(\tau_{z_1})}{\tau_{z_1}} & \frac{B_{3,t_i}(\tau_{z_1})}{\tau_{z_1}} \\
    \frac{B_{1,t_i}(\tau_{z_2})}{\tau_{z_2}} & \frac{B_{2,t_i}(\tau_{z_2})}{\tau_{z_2}} & \frac{B_{3,t_i}(\tau_{z_2})}{\tau_{z_2}} \\
    \vdots & \vdots & \vdots \\
    \frac{B_{1,t_i}(\tau_{z_3})}{\tau_{z_3}} & \frac{B_{2,t_i}(\tau_{z_3})}{\tau_{z_3}} & \frac{B_{3,t_i}(\tau_{z_3})}{\tau_{z_3}} \\
  \end{bmatrix}
  \begin{bmatrix}
    y_1(t_i) \\ y_2(t_i) \\ y_3(t_i)
  \end{bmatrix} + 
  \begin{bmatrix}
    e_1(t_i) \\ e_2(t_i) \\ e_3(t_i)
  \end{bmatrix}

  \end{equation}
 \]</p>

<p>where 
\[ 
  \begin{equation}
    e_t \sim N \left(0, \begin{bmatrix} r_1^2 & 0 & \cdots & 0 \\ 0 & r_2^2 & \cdots & 0 \\ \vdots&\vdots&\ddots&\vdots \\  0 & 0 & 0 & r_n^2 \end{bmatrix} \right)
  \end{equation}
 \]</p>

<p>and the state equation for 3 factors are:
\[ 
  \begin{equation}
  \begin{bmatrix}
    y_1(t_i) \\
    y_2(t_i) \\
    y_3(t_i) \\
  \end{bmatrix} =
  \begin{bmatrix}
    \theta_1(1-e^{-\kappa_1\Delta t}) \\
    \theta_2(1-e^{-\kappa_2\Delta t}) \\
    \theta_3(1-e^{-\kappa_3\Delta t}) \\
  \end{bmatrix} +
  \begin{bmatrix}
    e^{-\kappa_1\Delta t} & 0 & 0 \\
    0 & e^{-\kappa_2\Delta t} & 0\\
    0 & 0 & e^{-\kappa_3\Delta t} \\
  \end{bmatrix} 
  \begin{bmatrix}
    y_1(t_{i-1}) \\
    y_2(t_{i-1}) \\
    y_3(t_{i-1}) \\
  \end{bmatrix} +
  \begin{bmatrix}
    \epsilon_1(t_i) \\
    \epsilon_2(t_i) \\
    \epsilon_3(t_i) \\
  \end{bmatrix}
  \end{equation}
\]
</p>

<p>with 
\[ 
  \begin{equation}
    \epsilon_t \sim N 
    \left(0, 
    \begin{bmatrix} 
    \frac{\sigma_1^2}{2\kappa_1}(1-e^{-2\kappa_1\Delta t}) & 0 & 0 \\ 
    0 & \frac{\sigma_2^2}{2\kappa_2}(1-e^{-2\kappa_2\Delta t}) & 0 \\ 
    0 & 0 & \frac{\sigma_3^2}{2\kappa_3}(1-e^{-2\kappa_3\Delta t}) 
    \end{bmatrix} 
    \right)
  \end{equation}
 \]</p>

***

## Simulation Results
Monthly observations for 10 years were simulated with a short rate process under the Vasicek model, producing a time series of 120 points where each observation in time comprise multiple zero-coupon bond prices. This was done 250 times. For each simulation, a 1, 2 or 3 factor Vasicek model was calibrated to observed prices. With this, a distribution of the most likely parameters was plotted as a histogram and compared with a normal distribution of same mean and standard deviation. Sample paths of the filtered short rate (or factors) was also plotted against the actual simulated process.

You can find the code for generating the following results [here at github](https://gist.github.com/jgmodgoh/7508508).

### 1 factor Vasicek model
<p>Results of the 1 factor model calibration is tabulated below. Parameter estimation was performed using 4 bond prices of 1M, 3M, 6M and 10Y maturities. You can see that the algorithm does a pretty good job of fitting the model with the exception of \( \theta \) and \( \lambda \) having a relatively higher standard deviation.</p>

<table>
<tr>
<th>parameter</th><th>actual</th><th>mean</th><th>s.d.</th></tr>
<tr>
<td>\(\kappa\)</td><td>0.0600</td><td>0.0600</td><td>0.0017</td></tr>
<tr>
<td>\(\theta\)</td><td>0.0500</td><td>0.0495</td><td>0.0238</td></tr>
<tr>
<td>\(\sigma\)</td><td>0.0200</td><td>0.0197</td><td>0.0012</td></tr>
<tr>
<td>\(\lambda\)</td><td>-0.2000</td><td>-0.2035</td><td>0.0718</td></tr>
</table>
<br>
<table>
<tr>
<th>error</th><th>actual</th><th>mean</th><th>s.d.</th></tr>
<tr>
<td>\(r_1\)</td><td>0.0010</td><td>0.0010</td><td>0.0001</td></tr>
<tr>
<td>\(r_2\)</td><td>0.0010</td><td>0.0010</td><td>0.0001</td></tr>
<tr>
<td>\(r_3\)</td><td>0.0010</td><td>0.0010</td><td>0.0001</td></tr>
<tr>
<td>\(r_4\)</td><td>0.0010</td><td>0.0010</td><td>0.0001</td></tr>
</table>

The next graph shows that the short rate process extracted based on observed prices closely approximates the actual process. Estimated parameters also look normally distributed.

<figure>
  <a href="/images/2013-11-17-blog/1factor_short_rate.svg"><img src="/images/2013-11-17-blog/1factor_short_rate.svg"></a>
  <a href="/images/2013-11-17-blog/1factor_params.svg"><img src="/images/2013-11-17-blog/1factor_params.svg"></a>
</figure>

***

### 2 factor Vasicek model 
<p>With a 2 factor model the short rate is modeled as a sum of 2 latent factors \(r(t)=y_1(t)+y_2(t)\). Here, state variables are taken to be independent eventhough the Vasicek model allows for covariance. Parameter estimation was performed using 9 bond prices of 1M, 3M, 6M, 1Y, 2Y, 3Y, 5Y, 7Y and 10Y maturities. Results are mostly similiar to the 1 factor model. An interesting difference is that the optimization routine was unable to precisely calibrate the long term means \( \theta_1 \) and \( \theta_2 \). Distributions of long term means are observed to be non-normal and paths of each factor can be seen as shifted up or down. However summing both factors show that the filtered short rate does track the actual short rate process closely.</p>

<table>
<tr>
<th>parameter</th><th>actual</th><th>mean</th><th>s.d.</th></tr>
<tr>
<td>\(\kappa_1\)</td><td>0.0600</td><td>0.0605</td><td>0.0046</td></tr>
<tr>
<td>\(\kappa_2\)</td><td>0.7000</td><td>0.7008</td><td>0.0111</td></tr>
<tr>
<td>\(\theta_1\)</td><td>0.0500</td><td>0.0338</td><td>0.0317</td></tr>
<tr>
<td>\(\theta_2\)</td><td>0.0100</td><td>0.0268</td><td>0.0314</td></tr>
<tr>
<td>\(\sigma_1\)</td><td>0.0200</td><td>0.0199</td><td>0.0012</td></tr>
<tr>
<td>\(\sigma_2\)</td><td>0.0500</td><td>0.0496</td><td>0.0029</td></tr>
<tr>
<td>\(\lambda_1\)</td><td>-0.2000</td><td>-0.2036</td><td>0.0689</td></tr>
<tr>
<td>\(\lambda_2\)</td><td>-0.5000</td><td>-0.4841</td><td>0.2675</td></tr>
</table>
<br>
<table>
<tr>
<th>error</th><th>actual</th><th>mean</th><th>s.d.</th></tr>
<tr>
<td>\(r_1\)</td><td>0.0010</td><td>0.0010</td><td>0.0001</td></tr>
<tr>
<td>\(r_2\)</td><td>0.0010</td><td>0.0010</td><td>0.0001</td></tr>
<tr>
<td>\(r_3\)</td><td>0.0010</td><td>0.0010</td><td>0.0001</td></tr>
<tr>
<td>\(r_4\)</td><td>0.0010</td><td>0.0010</td><td>0.0001</td></tr>
<tr>
<td>\(r_5\)</td><td>0.0010</td><td>0.0010</td><td>0.0001</td></tr>
<tr>
<td>\(r_6\)</td><td>0.0010</td><td>0.0010</td><td>0.0001</td></tr>
<tr>
<td>\(r_7\)</td><td>0.0010</td><td>0.0010</td><td>0.0001</td></tr>
<tr>
<td>\(r_8\)</td><td>0.0010</td><td>0.0010</td><td>0.0001</td></tr>
<tr>
<td>\(r_9\)</td><td>0.0010</td><td>0.0010</td><td>0.0001</td></tr>
</table>

<figure>
  <a href="/images/2013-11-17-blog/2factors.svg"><img src="/images/2013-11-17-blog/2factors.svg"></a>
</figure>

You can see here that summing both factors gives a filtered short rate that closely tracks the simulated rate.

<figure>
  <a href="/images/2013-11-17-blog/2factors_short_rate.svg"><img src="/images/2013-11-17-blog/2factors_short_rate.svg"></a>
  <a href="/images/2013-11-17-blog/2factors_params1.svg"><img src="/images/2013-11-17-blog/2factors_params1.svg"></a>
  <a href="/images/2013-11-17-blog/2factors_params2.svg"><img src="/images/2013-11-17-blog/2factors_params2.svg"></a>
</figure>

***

### 3 factor Vasicek model 
As with the 2 factor model, the 3 factor model yield similar results. Parameter estimation was performed using 14 bond prices of 1M, 3M, 6M, 1Y, 2Y, 3Y, 4Y, 5Y, 7Y, 10Y, 12Y, 15Y, 20Y and 30Y maturities.

<table>
<tr>
<th>parameters</th><th>actual</th><th>mean</th><th>s.d</th></tr>
<tr>
<td>\(\kappa_1\)</td><td>0.0600</td><td>0.0604</td><td>0.0035</td></tr>
<tr>
<td>\(\kappa_2\)</td><td>0.3000</td><td>0.3008</td><td>0.0128</td></tr>
<tr>
<td>\(\kappa_3\)</td><td>0.7000</td><td>0.7089</td><td>0.053</td></tr>
<tr>
<td>\(\theta_1\)</td><td>0.0100</td><td>0.0246</td><td>0.0322</td></tr>
<tr>
<td>\(\theta_2\)</td><td>0.0200</td><td>0.0226</td><td>0.0313</td></tr>
<tr>
<td>\(\theta_3\)</td><td>0.0400</td><td>0.022</td><td>0.0294</td></tr>
<tr>
<td>\(\sigma_1\)</td><td>0.0200</td><td>0.0201</td><td>0.0014</td></tr>
<tr>
<td>\(\sigma_2\)</td><td>0.0500</td><td>0.0494</td><td>0.0037</td></tr>
<tr>
<td>\(\sigma_3\)</td><td>0.0300</td><td>0.0295</td><td>0.0035</td></tr>
<tr>
<td>\(\lambda_1\)</td><td>-0.2000</td><td>-0.2000</td><td>0.0724</td></tr>
<tr>
<td>\(\lambda_2\)</td><td>-0.5000</td><td>-0.5134</td><td>0.1976</td></tr>
<tr>
<td>\(\lambda_3\)</td><td>-0.1500</td><td>-0.1509</td><td>0.2557</td></tr>
</table>
<br>

<table>
<tr>
<th>error</th><th>actual</th><th>mean</th><th>s.d.</th></tr>
<tr>  
<td>\(r_1\)</td><td>0.0010</td><td>0.0010</td><td>0.0001</td></tr>
<tr>
<td>\(r_2\)</td><td>0.0010</td><td>0.0010</td><td>0.0001</td></tr>
<tr>
<td>\(r_3\)</td><td>0.0010</td><td>0.0010</td><td>0.0001</td></tr>
<tr>
<td>\(r_4\)</td><td>0.0010</td><td>0.0010</td><td>0.0001</td></tr>
<tr>
<td>\(r_5\)</td><td>0.0010</td><td>0.0010</td><td>0.0001</td></tr>
<tr>
<td>\(r_6\)</td><td>0.0010</td><td>0.0010</td><td>0.0001</td></tr>
<tr>
<td>\(r_7\)</td><td>0.0010</td><td>0.0010</td><td>0.0001</td></tr>
<tr>
<td>\(r_8\)</td><td>0.0010</td><td>0.0010</td><td>0.0001</td></tr>
<tr>
<td>\(r_9\)</td><td>0.0010</td><td>0.0010</td><td>0.0001</td></tr>
<tr>
<td>\(r_{10}\)</td><td>0.0010</td><td>0.0010</td><td>0.0001</td></tr>
<tr>
<td>\(r_{11}\)</td><td>0.001</td><td>0.001</td><td>0.0001</td></tr>
<tr>
<td>\(r_{12}\)</td><td>0.001</td><td>0.001</td><td>0.0001</td></tr>
<tr>
<td>\(r_{13}\)</td><td>0.001</td><td>0.001</td><td>0.0001</td></tr>
<tr>
<td>\(r_{14}\)</td><td>0.001</td><td>0.001</td><td>0.0001</td></tr>
</table>

<figure><img src="/images/2013-11-17-blog/3factors.svg">
  <a href="/images/2013-11-17-blog/3factors_short_rate.svg"><img src="/images/2013-11-17-blog/3factors_short_rate.svg"></a>
  <a href="/images/2013-11-17-blog/3factors_params1.svg"><img src="/images/2013-11-17-blog/3factors_params1.svg"></a>
  <a href="/images/2013-11-17-blog/3factors_params2.svg"><img src="/images/2013-11-17-blog/3factors_params2.svg"></a>
  <a href="/images/2013-11-17-blog/3factors_params3.svg"><img src="/images/2013-11-17-blog/3factors_params3.svg"></a>
</figure>

***

### Conclusion
The Kalman filter is a powerful algorithm that can be applied to many time series analyses problems. Non-linear Kalman filters such as the extended and unscented Kalman filters are also available for more complex systems.

This exercise shows that the Kalman filter effectively extracts latent factors from a noisy signal. The tricky part of utilizing this algorithm lies with formulating the problem in a state space format. Once this is done, tweaking the optimization routine also involves some trial and error. 

Here I used the Vasicek model where it is important to know the limitations and shortcomings of the model itself, such as the possibility for negative interest rates and the inability of a 1 factor model to adequately allow for complex term structure dynamics. There are numerous academic resources devoted to this. Nevertheless the focus here is to highlight and better understand the Kalman filter.

 As with the majority of tasks I encounter, the theoretical aspect may be straightforward but the implementation often proves much more challenging and offers a great learning experience.

***

[^1]: Graphics generated by [www.moqups.com](https://moqups.com/)
[^2]: [Affine Term-Structure Models: Theory and Implementation by David Jamison Bolder, Bank of Canada Working Paper 2001-15.](http://www.bankofcanada.ca/2001/10/publications/research/working-paper-2001-15/)