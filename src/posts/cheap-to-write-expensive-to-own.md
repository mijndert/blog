---
title: "Cheap to write, expensive to own"
date: 2026-06-08 12:55:00
summary: "Creating code with AI is cheap, owning it will always be expensive."
tags:
  - AI
  - devops
draft: true
---

I'm sorry, but we have to talk about AI. Especially AI use in engineering teams.

It's all everyone's talking about right now. It's the hype du jour. LinkedIn thought leaders won't shut up about how not using AI will put you at a disadvantage. If you're left behind even a little bit, don't be surprised when your job doesn't exist anymore mere months from now.

Recently a new project saw the light of day. It looked finished, it worked, the happy path was clean, the code read well at first, it had clearly come together fast. But it only came together fast because almost none of the code was written by a human. That made me suspicious so I had a deeper look at the code and how it came to be.

I looked at the security posture of the code and what I found was shocking. Mistakes that even a junior engineer wouldn't make. Endpoints where the auth could easily be bypassed, no content-type checks, no rate limits. It's easy to blame it on AI, but the fact of the matter is that the human writing the prompt should've done his due diligence as well.

Obviously, this project didn't make it to production without a massive rework and a costly delay.

The thing that stuck with me: the code wasn't actively broken. It wasn't malicious, it was _plausible_. It did exactly what it had been asked to do, and nothing more. That turns out to be the most dangerous property AI generated code can have.

## Thought leaders

Meanwhile, my feeds are full of "leads" and "managers" explaining that if you haven't fully adopted AI you'll be obsolete in six months.

The timeline is unfalsifiable. When the six months pass and everyone still has a job, nobody posts about how they were wrong. It's the same prophecy that got made during every hype cycle before this one. And it tends to come loudest from people whose relationship to the code stops at the KPI dashboard.

I'll let you draw your own conclusion about who benefits from engineers feeling that scared.

## Writing code isn't the bottleneck

I use AI tools almost every day and I lean on them quite a bit. They're excellent for spelunking through logs and traces, they scaffold some of my Terraform code and Helm charts which I then hand review, and they make a great rubber duck when I'm stuck on a tricky bug or implementation. They'll write a serviceable first draft of a runbook or some documentation, and they help me make sense of raw data a lot faster than I would on my own.

So I'm not against the tools at all, I'm against the pretending. And honestly that's the part that gets to me, because the hype oversells the part that was always easy and stays very quiet about the parts that were always hard.

Writing code faster was never the bottleneck. The bottleneck has always been understanding it, owning it, and keeping it alive at 2 AM when something breaks. AI made _producing code_ practically free and did next to nothing for the cost of _owning it_. So now we generate a lot more of the thing that was already cheap, without growing any new capacity to actually own all of it.

## Code review is increasingly difficult

Code review used to work because writing said code was expensive too. Producing a change and reviewing it took roughly the same kind of effort, so the two stayed in balance. That balance is gone now that I can generate a 1000-line pull request in a couple of minutes, and that's exactly the point where proper review tends to stop happening.

It fails on both ends. The author skims their own diff, because the model wrote it and reading your own homework feels a bit pointless. The reviewer rubber-stamps it, because the PR is huge, it looks right, and surely the AI knew what it was doing. Nobody really decides to stop reviewing, it just slowly stops being worth anyone's time.

## Security is eroding

The security problems follow directly from this, and they're not sabotage or bad luck. The model did exactly what it was asked. Rate limits, content-type checks, authorization, input validation, that's all the stuff you only get when someone actually thinks to ask for it. It's everything that isn't in the requirements, the things you add because you've been burned before, or because you can vividly imagine being burned.

And the people leaning hardest on AI to skip the thinking are, more and more, the people who no longer know what to ask for in the first place.

That's the part that worries me more than any single incident. If you lean on the model from day one you get your answers without ever doing the hard work, and the hard work is exactly how you learn to tell a good answer apart from a confident, well-formatted wrong one.

The skill that makes review possible is knowing what good code looks like in the first place, and that's the very skill we're eroding, at both ends at once. We're pulling out the checks and balances because we can't keep up with the pace anymore.

## So what do we do?

I don't think the answer is to put the tools down, so let me try to be constructive about it.

Use all the AI you want, but treat whatever comes out the way you'd treat a pull request from a sharp, fast, slightly overconfident junior: often right, but never trusted on sight. Keep your diffs small enough that a human can still review them properly. The cheapness of generating code is the trap, so put some of that cost back in on purpose.

Threat-model the boring stuff yourself, because nothing else is going to do it for you. And hold on to the one rule that doesn't bend: the author owns the code, not the model. "The AI wrote it" has never been a line in a postmortem, and it never will be (I hope).

None of this is really at odds with moving fast, either. Discipline and speed aren't opposites. I'm fairly convinced the engineers still worth employing in five years won't be the fastest typists, they'll be the ones who can look at a perfectly plausible diff and feel, in their gut, that something's off. You're not going to get left behind for being careful, or even a little apprehensive about all of this.

Generating code got cheap. Owning it, not so much.
