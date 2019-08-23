---
title: Contributing
# We can even add meta tags to the page! This sets the keywords meta tag.
# <meta name="keywords" content="my SEO keywords"/>
description: Conributions guide for the Visual Studio Code Peacock extension
meta:
  - name: keywords
  - content: vscode "visual studio code" peacock theme extension contributions
---
# Contributing

We would love for you to contribute and help make it even better
than it is today! As a contributor, here are the guidelines we would like you
to follow:

-[Code of Conduct](#coc)

- [Issues and Bugs](#issue)
- [Feature Requests](#feature)
- [Submission Guidelines](#submit)

## <a name="coc" > </a> Code of Conduct

Help us keep this project open and inclusive.Please read and follow our [Code of Conduct](./code_of_conduct).

## <a name="issue" > </a> Found an Issue?

If you find a bug in the source code or a mistake in the documentation, you can help us by
[submitting an issue](#submit-issue) to our [GitHub Repository](https://github.com/johnpapa/vscode-peacock). Even better, you can
[submit a Pull Request](#submit-pr) with a fix.

## <a name="feature" > </a> Want a Feature?

You can _request_ a new feature by [submitting an issue](#submit - issue) to our [GitHub
Repository][github].If you would like to _implement_ a new feature, please submit an issue with
a proposal for your work first, to be sure that we can use it.

- **Small Features** can be crafted and directly [submitted as a Pull Request](#submit - pr).

## <a name="submit" > </a> Submission Guidelines

### <a name="submit-issue" > </a> Submitting an Issue

Before you submit an issue, search the archive, maybe your question was already answered.

If your issue appears to be a bug, and hasn't been reported, open a new issue.
Help us to maximize the effort we can spend fixing issues and adding new
features, by not reporting duplicate issues.Providing the following information will increase the
chances of your issue being dealt with quickly:

- **Overview of the Issue** - if an error is being thrown a non- minified stack trace helps
  - **Version** - what version is affected (e.g. 0.1.2)
    - **Motivation for or Use Case** - explain what are you trying to do and why the current behavior is a bug for you
      - **Browsers and Operating System** - is this a problem with all browsers?
- **Reproduce the Error** - provide a live example or a unambiguous set of steps
  - **Related Issues** - has a similar issue been reported before?
- **Suggest a Fix** - if you can't fix the bug yourself, perhaps you can point to what might be
  causing the problem (line of code or commit)

You can file new issues by providing the above information [here](https://github.com/johnpapa/vscode-peacock/issues/new).

### <a name="submit-pr" > </a> Submitting a Pull Request (PR)

Before you submit your Pull Request (PR) consider the following guidelines:

- Search [GitHub](https://github.com/johnpapa/vscode-peacock/pulls) for an open or closed PR
  that relates to your submission.You don't want to duplicate effort.

  - Make your changes in a new git fork:

- Commit your changes using a descriptive commit message
  - Push your fork to GitHub:
- In GitHub, send a pull request

  - If we suggest changes then:
  - Make the required updates.
  - Rebase your fork and force push to your GitHub repository (this will update your Pull Request):

    ```shell
    git rebase master -i
    git push -f
    ```

That's it! Thank you for your contribution!
